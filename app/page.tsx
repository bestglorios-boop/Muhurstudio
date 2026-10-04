import { featuredProjects } from "@/data/projects";
import { Hero } from "@/components/hero/Hero";
import { Intro } from "@/components/sections/Intro";
import { FeaturedWork } from "@/components/project/FeaturedWork";
import { Services } from "@/components/sections/Services";
import { Approach } from "@/components/sections/Approach";
import { Manifesto } from "@/components/sections/Manifesto";
import { Contact } from "@/components/sections/Contact";

/**
 * Anasayfa — birbirinden ayrık sekiz bileşen değil, tek bir kesintisiz anlatı.
 * Koyu → kâğıt → koyu → kâğıt → koyu ritmi editoryaldir, dama tahtası gibi değil.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <FeaturedWork projects={featuredProjects} />
      <Services />
      <Approach />
      <Manifesto />
      <Contact />
    </>
  );
}
