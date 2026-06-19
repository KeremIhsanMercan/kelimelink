import { useState, useRef, useEffect } from 'react';
import { Menu, Signpost, PenTool, Clock, BookOpen } from 'lucide-react';

export default function NavMenu() {
  const [showNavMenu, setShowNavMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNavMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div className="nav-menu-wrapper hide-on-mobile" style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="app-header__action-btn"
        onClick={() => setShowNavMenu(!showNavMenu)}
        aria-label="Menü"
        title="Menü"
      >
        <Menu size={20} />
      </button>
      {showNavMenu && (
        <div className="nav-menu-dropdown">
          <a href="/nasil-oynanir" className="nav-menu-item"><Signpost size={16} /> Detaylı Oyun Rehberi</a>
          <a href="/hakkinda" className="nav-menu-item"><PenTool size={16} /> Hakkında</a>
          <a href="/arsiv" className="nav-menu-item"><Clock size={16} /> Arşiv</a>
          <a href="/blog" className="nav-menu-item"><BookOpen size={16} /> Blog</a>
        </div>
      )}
    </div>
  );
}
