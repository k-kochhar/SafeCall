"use client";

import Header from "../components/Header";
import Image from "next/image";
import LandingFooter from "../components/LandingFooter";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex justify-between w-full p-4">
        <div>Left Item</div>
        <div>Right Item</div>
      </div>
      <LandingFooter />
    </div>
  );
}
