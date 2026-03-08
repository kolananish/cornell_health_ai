"""Shared model classes for VocalHealth AI psych screener.

Import this module wherever psych_screener_v3.joblib is loaded or saved
so that joblib can pickle/unpickle the custom classes correctly.

Classes
-------
CalibratedOrdinalClassifier
    Single regressor trained on ordinal target + isotonic calibration.

OrdinalEnsembleClassifier
    Ensemble of heterogeneous ordinal regressors (Huber + TabPFN).
    Averages min-max-normalised raw regression scores, then calibrates.
    Best of benchmark: AUC=0.7614 raw / 0.7443 calibrated.
"""
from __future__ import annotations

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.isotonic import IsotonicRegression
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline


class CalibratedOrdinalClassifier(BaseEstimator, ClassifierMixin):
    """Regression-based classifier with isotonic probability calibration.

    Fits a regression pipeline on a continuous ordinal target (e.g., PHQ-9 total
    score 0–27), then calibrates its output to P(target >= threshold) via
    OOF-fitted isotonic regression.

    This preserves more label information than a binary classifier — PHQ=8 and
    PHQ=12 are both "near the threshold" but the regressor treats them differently,
    which the AUC evaluation on the binary target benefits from.

    Parameters
    ----------
    regressor_pipeline : sklearn Pipeline
        Must end with a regressor (not a classifier).
    """

    def __init__(self, regressor_pipeline: Pipeline) -> None:
        self.regressor_pipeline = regressor_pipeline
        self.calibrator_: IsotonicRegression | None = None
        self.classes_ = np.array([0, 1])

    def fit(self, X: np.ndarray, y_total: np.ndarray) -> "CalibratedOrdinalClassifier":
        """Fit regression pipeline on continuous target only (no calibration)."""
        self.regressor_pipeline.fit(X, y_total)
        return self

    def fit_calibrated(self, X: np.ndarray, y_total: np.ndarray,
                       y_binary: np.ndarray,
                       cv_splits: int = 5) -> "CalibratedOrdinalClassifier":
        """Fit regressor on continuous target + calibrate via OOF isotonic regression.

        Steps:
        1. 5-fold CV to get OOF regression scores (no data leakage).
        2. Fit IsotonicRegression: OOF scores -> P(y_binary=1).
        3. Refit regressor on full data.
        """
        from sklearn.model_selection import cross_val_predict
        kf = KFold(n_splits=cv_splits, shuffle=True, random_state=42)
        oof_scores = cross_val_predict(self.regressor_pipeline, X, y_total, cv=kf)

        self.calibrator_ = IsotonicRegression(out_of_bounds='clip')
        self.calibrator_.fit(oof_scores, y_binary)

        self.regressor_pipeline.fit(X, y_total)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.calibrator_ is None:
            raise RuntimeError("Call fit_calibrated() before predict_proba()")
        raw = self.regressor_pipeline.predict(X)
        prob_pos = np.clip(self.calibrator_.predict(raw), 0.0, 1.0)
        return np.column_stack([1.0 - prob_pos, prob_pos])

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


class OrdinalEnsembleClassifier(BaseEstimator, ClassifierMixin):
    """Ensemble of ordinal regressors calibrated to binary probabilities.

    Each base regressor is trained on a continuous ordinal target (PHQ-9 total,
    0–27).  Their OOF predictions are min-max normalised to [0, 1] and averaged.
    The averaged scores are then calibrated to P(PHQ-9 >= 10) via OOF-fitted
    isotonic regression.

    Best result from deep tabular benchmark: Huber + TabPFN ordinal ensemble
    achieves AUC=0.7614 raw (vs Huber solo 0.7593, +0.002).

    Parameters
    ----------
    regressors : list of (name, estimator) tuples
        Each estimator must implement fit(X, y) and predict(X).
    """

    def __init__(self, regressors: list[tuple[str, object]]) -> None:
        self.regressors = regressors
        self.calibrator_: IsotonicRegression | None = None
        self.classes_ = np.array([0, 1])
        self._fitted_regressors: list[object] = []

    @staticmethod
    def _minmax(arr: np.ndarray) -> np.ndarray:
        lo, hi = arr.min(), arr.max()
        return (arr - lo) / (hi - lo + 1e-8)

    def fit_calibrated(self, X: np.ndarray, y_total: np.ndarray,
                       y_binary: np.ndarray,
                       cv_splits: int = 5) -> "OrdinalEnsembleClassifier":
        """Fit all regressors and calibrate the ensembled OOF scores."""
        kf = KFold(n_splits=cv_splits, shuffle=True, random_state=42)
        n = len(y_total)

        # Collect OOF regression scores for each base model
        oof_arrays: list[np.ndarray] = []
        for name, reg in self.regressors:
            oof = np.zeros(n)
            for tr_idx, te_idx in kf.split(X):
                import copy
                reg_clone = copy.deepcopy(reg)
                reg_clone.fit(X[tr_idx], y_total[tr_idx])
                oof[te_idx] = reg_clone.predict(X[te_idx])
            oof_arrays.append(oof)
            print(f"    [{name}] OOF raw AUC={float(np.abs(np.corrcoef(oof, y_binary)[0,1])):.3f}")

        # Average min-max normalised scores
        ensemble_oof = np.mean([self._minmax(a) for a in oof_arrays], axis=0)

        # Fit isotonic calibrator on ensemble OOF
        self.calibrator_ = IsotonicRegression(out_of_bounds='clip')
        self.calibrator_.fit(ensemble_oof, y_binary)

        # Refit all regressors on full data
        self._fitted_regressors = []
        for name, reg in self.regressors:
            import copy
            reg_full = copy.deepcopy(reg)
            reg_full.fit(X, y_total)
            self._fitted_regressors.append(reg_full)

        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        if self.calibrator_ is None or not self._fitted_regressors:
            raise RuntimeError("Call fit_calibrated() before predict_proba()")
        raw_preds = [reg.predict(X) for reg in self._fitted_regressors]
        ensemble_score = np.mean([self._minmax(p) for p in raw_preds], axis=0)
        prob_pos = np.clip(self.calibrator_.predict(ensemble_score), 0.0, 1.0)
        return np.column_stack([1.0 - prob_pos, prob_pos])

    def predict(self, X: np.ndarray) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)
