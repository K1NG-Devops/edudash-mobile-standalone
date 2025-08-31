import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isBottomNavVisible: boolean;
  hideBottomNav: () => void;
  showBottomNav: () => void;
  setBottomNavVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);

  const hideBottomNav = () => setIsBottomNavVisible(false);
  const showBottomNav = () => setIsBottomNavVisible(true);
  const setBottomNavVisible = (visible: boolean) => setIsBottomNavVisible(visible);

  return (
    <NavigationContext.Provider
      value={{
        isBottomNavVisible,
        hideBottomNav,
        showBottomNav,
        setBottomNavVisible,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Custom hook for managing navigation visibility based on state
export const useNavigationVisibility = (shouldHide: boolean) => {
  const { setBottomNavVisible } = useNavigation();
  
  React.useEffect(() => {
    setBottomNavVisible(!shouldHide);
    
    // Cleanup: show navigation when component unmounts
    return () => {
      setBottomNavVisible(true);
    };
  }, [shouldHide, setBottomNavVisible]);
};
