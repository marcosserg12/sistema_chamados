import React, { createContext, useContext, useState, useEffect } from "react";
import { router, usePage } from '@inertiajs/react';

const ThemeContext = createContext({
  darkMode: false,
  menuCompacto: false,
  setDarkMode: () => {},
  setMenuCompacto: () => {},
  toggleDarkMode: () => {},
  toggleMenuCompacto: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const { auth } = usePage().props;

  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return auth?.user?.preferencias?.dark_mode ?? (saved ? JSON.parse(saved) : false);
  });

  const [menuCompacto, setMenuCompactoState] = useState(() => {
    const saved = localStorage.getItem("menuCompacto");
    return auth?.user?.preferencias?.menu_compacto ?? (saved ? JSON.parse(saved) : false);
  });

  // Sincroniza estado quando o auth muda (vindo do backend)
  useEffect(() => {
    if (auth?.user?.preferencias) {
      if (typeof auth.user.preferencias.dark_mode !== 'undefined') {
        setDarkModeState(auth.user.preferencias.dark_mode);
      }
      if (typeof auth.user.preferencias.menu_compacto !== 'undefined') {
        setMenuCompactoState(auth.user.preferencias.menu_compacto);
      }
    }
  }, [auth?.user?.preferencias]);

  const setDarkMode = (value) => {
    setDarkModeState(value);
    localStorage.setItem("darkMode", JSON.stringify(value));

    if (auth?.user) {
      router.patch(route('configuracoes.update'), { dark_mode: value }, {
        preserveScroll: true,
      });
    }
  };

  const setMenuCompacto = (value) => {
    setMenuCompactoState(value);
    localStorage.setItem("menuCompacto", JSON.stringify(value));

    if (auth?.user) {
      router.patch(route('configuracoes.update'), { menu_compacto: value }, {
        preserveScroll: true,
      });
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMenuCompacto = () => setMenuCompacto(!menuCompacto);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{
      darkMode,
      menuCompacto,
      setDarkMode,
      setMenuCompacto,
      toggleDarkMode,
      toggleMenuCompacto,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
