"use client";

import { FaUserPlus, FaSignInAlt, FaPhone } from "react-icons/fa";
import Image from "next/image";

export default function Header() {
	return (
		<div className="relative isolate overflow-hidden bg-zinc-900">
			<div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
				<div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
					<h1 className="text-4xl font-bold bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
						<FaPhone className="w-8 h-8 text-white transform rotate-90" />
						SafeCall
					</h1>
					<h1 className="mt-10 text-5xl font-semibold tracking-tight text-pretty text-white sm:text-7xl">
						Secure Your{" "}
						<span className="relative inline-block">
							<span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-10 rounded-lg -rotate-1 transform"></span>
							<span className="absolute inset-0 bg-gradient-to-l from-pink-500 via-purple-500 to-indigo-500 px-10 rounded-lg rotate-1 transform"></span>
							<span className="relative z-10 text-indigo-100 font-bold">
								Workforce
							</span>
						</span>
					</h1>
					<p className="flex-wrap mt-8 text-xl font-medium text-pretty text-zinc-400">
						We leverage AI-driven social engineering to pinpoint and resolve
						human vulnerabilities,{" "}
						<span className="text-indigo-500 font-bold"> protecting </span> your
						enterprise from the inside out.{" "}
					</p>
					<div className="mt-10 flex items-center justify-between sm:justify-start gap-x-6 gap-y-4">
						<button
							onClick={() => (window.location.href = "/dashboard")}
							className="w-40 h-11 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
						>
							Dashboard
						</button>
						<button
							onClick={() => (window.location.href = "/home")}
							className="w-40 h-11 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
						>
							Get Started
						</button>
					</div>
				</div>
				<div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none xl:ml-32">
					<div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
						<div className="mt-10 flex items-center gap-x-6"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
