import { AboutBand } from "../components/AboutBand";
import { ContactBand } from "../components/ContactBand";
import { Cover } from "../components/Cover";
import { RecordBand } from "../components/RecordBand";
import { SelectedWork } from "../components/SelectedWork";

/**
 * The cover: five bands, one argument. Cover, the record, selected work, about,
 * and contact. The record and work band each link to their full page; skills
 * and Forward are deliberately absent (they live in the CV).
 */
export function Home() {
  return (
    <>
      <Cover />
      <RecordBand />
      <SelectedWork />
      <AboutBand />
      <ContactBand />
    </>
  );
}
