"use client";

import Header from "../components/Header";
import LandingFooter from "../components/LandingFooter";
import DashboardTable from "../components/DashboardTable";
import React, { useState } from "react";

export default function Dashboard() {
  const [calls, setCalls] = useState(0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="mx-auto p-4">
        <p className="font-bold text-lg text-pretty text-white-400 sm:text-xl mt-8">
          Total call number: {calls}
        </p>
        <div className="mt-10"> 
          <DashboardTable />
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
