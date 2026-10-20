/**
 * Footer — colophon only. No theme control, no extra links.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#767676] bg-[#FFFFFF]">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6">
        <p className="max-w-[66ch] text-[0.875rem] leading-[1.45] text-[#595959]">
          © {year} Nathaniel Nikolai Ladero — built by hand.
        </p>
      </div>
    </footer>
  );
}
