#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import warnings
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

DEFAULT_CANDIDATES = [
    "6.4.1",
    "6.3.2",
    "6.2.1",
    "6.1.0",
    "6.0.6",
    "2.2.1",
    "2.1.3",
    "2.1.2",
    "2.0.9",
    "2.0.8",
    "2.0.7",
    "2.0.5",
    "2.0.1",
    "2.0.0",
    "0.1.11",
]


def _sha256(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _pkg_version(name: str) -> str | None:
    try:
        return version(name)
    except PackageNotFoundError:
        return None


def _probe(model_path: Path, root_dir: Path) -> tuple[bool, str]:
    try:
        ml_service_dir = root_dir / "ml-service"
        if str(ml_service_dir) not in sys.path:
            sys.path.insert(0, str(ml_service_dir))

        import model_loader
        import sklearn
        import tabpfn

        os.environ["ML_MODEL_PATH"] = str(model_path)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            loaded = model_loader.load_model()
        pipeline = loaded.pipeline
        if not hasattr(pipeline, "predict_proba"):
            return False, "Loaded pipeline has no predict_proba method."

        return (
            True,
            f"OK tabpfn={getattr(tabpfn, '__version__', 'unknown')} "
            f"scikit-learn={sklearn.__version__}",
        )
    except Exception as exc:  # noqa: BLE001
        return False, f"{type(exc).__name__}: {exc}"


def _install_tabpfn(pip_bin: str, tabpfn_version: str) -> tuple[bool, str]:
    cmd = [
        pip_bin,
        "install",
        "--upgrade",
        "--force-reinstall",
        "--no-cache-dir",
        f"tabpfn=={tabpfn_version}",
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True)
    if completed.returncode == 0:
        return True, ""

    tail = "\n".join((completed.stderr or "").splitlines()[-8:])
    return False, tail


def _candidates_from_env() -> list[str]:
    raw = os.environ.get("ML_TABPFN_CANDIDATES", "").strip()
    if not raw:
        return list(DEFAULT_CANDIDATES)
    return [value.strip() for value in raw.split(",") if value.strip()]


def _write_lock(lock_path: Path, model_path: Path, probe_message: str) -> None:
    payload = {
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "model_path": str(model_path),
        "model_sha256": _sha256(model_path),
        "tabpfn": _pkg_version("tabpfn"),
        "scikit_learn": _pkg_version("scikit-learn"),
        "probe": probe_message,
    }
    lock_path.write_text(json.dumps(payload, indent=2))


def _probe_subprocess(root_dir: Path, model_path: Path) -> tuple[bool, str]:
    cmd = [
        sys.executable,
        str(Path(__file__).resolve()),
        "--probe-only",
        "--root-dir",
        str(root_dir),
        "--model-path",
        str(model_path),
    ]
    completed = subprocess.run(cmd, capture_output=True, text=True)
    tail = (completed.stdout.strip() or completed.stderr.strip()).strip()
    if not tail:
        tail = f"probe exited with code {completed.returncode}"
    return completed.returncode == 0, tail


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pip-bin", default="")
    parser.add_argument("--root-dir", required=True)
    parser.add_argument("--model-path", required=True)
    parser.add_argument("--lock-file", default="")
    parser.add_argument("--probe-only", action="store_true")
    args = parser.parse_args()

    root_dir = Path(args.root_dir).resolve()
    model_path = Path(args.model_path).resolve()
    lock_path = Path(args.lock_file).resolve() if args.lock_file else root_dir / "ml-service/.runtime-lock.json"

    if args.probe_only:
        ok, msg = _probe(model_path, root_dir)
        print(msg)
        return 0 if ok else 1

    if not args.pip_bin:
        print("[ml-service] --pip-bin is required unless --probe-only is used.")
        return 1

    if not model_path.exists():
        print(f"[ml-service] Model file not found: {model_path}")
        return 1

    candidates = _candidates_from_env()
    if not candidates:
        print("[ml-service] No tabpfn candidates were configured.")
        return 1

    current = _pkg_version("tabpfn")
    if current:
        ok, msg = _probe_subprocess(root_dir, model_path)
        if ok:
            print(f"[ml-service] Runtime probe passed: {msg}")
            _write_lock(lock_path, model_path, msg)
            return 0
        print(f"[ml-service] Runtime probe failed with current deps: {msg}")
    else:
        print("[ml-service] tabpfn is not installed yet. Resolving compatible runtime...")

    if current and current in candidates:
        candidates = [current] + [value for value in candidates if value != current]

    for candidate in candidates:
        print(f"[ml-service] Trying tabpfn=={candidate} ...")
        installed, err_tail = _install_tabpfn(args.pip_bin, candidate)
        if not installed:
            print(f"[ml-service] Install failed for tabpfn=={candidate}")
            if err_tail:
                print(err_tail)
            continue

        ok, msg = _probe_subprocess(root_dir, model_path)
        if ok:
            print(f"[ml-service] Selected runtime: {msg}")
            _write_lock(lock_path, model_path, msg)
            return 0
        print(f"[ml-service] Probe failed for tabpfn=={candidate}: {msg}")

    print("[ml-service] Could not resolve a compatible TabPFN runtime for this model artifact.")
    print("[ml-service] If this persists, export the exact training env (pip freeze) and pin it directly.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
