import Image from "next/image";
import LandingHeader from "./components/LandingHeader";
import LandingFooter from "./components/LandingFooter";

export default function Home() {
  return (
    <div>
      <LandingHeader />
      <LandingFooter />
    </div>
  );
}
