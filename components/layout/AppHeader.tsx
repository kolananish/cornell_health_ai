import { CircleUserRound, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-[#dedfe7] bg-white">
      <div className="mx-auto flex h-[62px] w-full max-w-[1120px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/medical-history" className="leading-none">
            <div className="text-[26px] font-black tracking-[-0.6px] text-[#2D2D8C]">Teladoc</div>
            <div className="-mt-[4px] text-[8px] font-semibold uppercase tracking-[0.8px] text-[#0EA5B7]">
              Health
            </div>
          </Link>
          <nav className="hidden items-center gap-7 text-[14px] text-[#32343b] md:flex">
            <Link href="/medical-history" className="border-b-[3px] border-[#5a49e8] pb-[16px] font-semibold">
              Home
            </Link>
            <span className="text-[#464851]">Health Info</span>
          </nav>
        </div>

        <div className="flex items-center gap-5 text-[14px] text-[#2e2f35]">
          <div className="hidden items-center gap-2 md:flex">
            <MessageCircle size={14} />
            <span>Messages</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <CircleUserRound size={14} />
            <span>Account</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={13} />
            <span>Eng</span>
          </div>
          <button className="rounded-full bg-[#5a49e8] px-5 py-2 font-semibold text-white md:px-6">Get care</button>
        </div>
      </div>
    </header>
  );
}
