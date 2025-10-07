import { logoImage } from "@/assets/img";
import Image from "next/image";
import React from "react";
// this is no where page . no going to display 
export default function Home() {
  return (
    <main>
      <Image src={logoImage} alt="Vercel Logo" width={72} height={16} />
    </main>
  );
}
