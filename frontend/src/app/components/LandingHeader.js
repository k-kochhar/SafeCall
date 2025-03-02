"use client";

import { PhoneIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

export default function Header() {
	return (
		<div className="relative isolate overflow-hidden bg-zinc-900">
			<div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
				<div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:pt-8">
					<h1 className="text-4xl font-bold flex items-center gap-2">
						<div className="h-10 w-10 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center">
							<PhoneIcon className="h-5 w-5 text-white" />
						</div>
						SafeCall
					</h1>
					<h1 className="mt-10 text-5xl font-semibold tracking-tight text-pretty text-white sm:text-7xl">
						Stay Safe With{" "}
						<span className="relative inline-block">
							<span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 px-10 rounded-lg -rotate-1 transform"></span>
							<span className="absolute inset-0 bg-gradient-to-l from-teal-500 via-cyan-500 to-blue-500 px-10 rounded-lg rotate-1 transform"></span>
							<span className="relative z-10 text-blue-100 font-bold">
								SafeCall
							</span>
						</span>
					</h1>
					<p className="flex-wrap mt-8 text-xl font-medium text-pretty text-zinc-400">
						Whether you&apos;re walking alone, in a suspicious ride, or facing
						an urgent threat,{" "}
						<span className="text-blue-300 font-bold"> SafeCall </span>
						proactively checks in, deters danger, and silently alerts help when
						needed.
					</p>
					<div className="mt-10 flex items-center justify-between sm:justify-start gap-x-6 gap-y-4">
						<button
							onClick={() => (window.location.href = "/dashboard")}
							className="w-40 h-11 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-lg"
						>
							Dashboard
						</button>
						<button
							onClick={() => (window.location.href = "/home")}
							className="w-40 h-11 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-md transition-all duration-300 flex items-center justify-center gap-2 text-lg"
						>
							Get Started
						</button>
					</div>
				</div>
				<div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:mt-0 lg:mr-0 lg:ml-10 lg:max-w-none xl:ml-32">
					<div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
						<div className="mt-14 sm:mt-20 lg:mt-0 lg:shrink-0 lg:grow">
							<svg
								role="img"
								viewBox="0 0 366 729"
								className="mx-auto w-[20rem] max-w-full drop-shadow-xl"
							>
								<title>App screenshot</title>
								<defs>
									<clipPath id="2ade4387-9c63-4fc4-b754-10e687a0d332">
										<rect rx={36} width={320} height={684} />
									</clipPath>
								</defs>
								<path
									d="M363.315 64.213C363.315 22.99 341.312 1 300.092 1H66.751C25.53 1 3.528 22.99 3.528 64.213v44.68l-.857.143A2 2 0 0 0 1 111.009v24.611a2 2 0 0 0 1.671 1.973l.95.158a2.26 2.26 0 0 1-.093.236v26.173c.212.1.398.296.541.643l-1.398.233A2 2 0 0 0 1 167.009v47.611a2 2 0 0 0 1.671 1.973l1.368.228c-.139.319-.314.533-.511.653v16.637c.221.104.414.313.56.689l-1.417.236A2 2 0 0 0 1 237.009v47.611a2 2 0 0 0 1.671 1.973l1.347.225c-.135.294-.302.493-.49.607v377.681c0 41.213 22 63.208 63.223 63.208h95.074c.947-.504 2.717-.843 4.745-.843l.141.001h.194l.086-.001 33.704.005c1.849.043 3.442.37 4.323.838h95.074c41.222 0 63.223-21.999 63.223-63.212v-394.63c-.259-.275-.48-.796-.63-1.47l-.011-.133 1.655-.276A2 2 0 0 0 366 266.62v-77.611a2 2 0 0 0-1.671-1.973l-1.712-.285c.148-.839.396-1.491.698-1.811V64.213Z"
									fill="#6B7280"
								/>
								<path
									d="M16 59c0-23.748 19.252-43 43-43h246c23.748 0 43 19.252 43 43v615c0 23.196-18.804 42-42 42H58c-23.196 0-42-18.804-42-42V59Z"
									fill="#4A5568"
								/>
								<foreignObject
									width={316}
									height={684}
									clipPath="url(#2ade4387-9c63-4fc4-b754-10e687a0d332)"
									transform="translate(24 24)"
								>
									<Image
										alt="App screenshot"
										src="app_ss.png"
										width={316}
										height={684}
										unoptimized={true}
									/>
								</foreignObject>
							</svg>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
