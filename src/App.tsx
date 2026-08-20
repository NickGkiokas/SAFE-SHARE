import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { SCREENS } from "./types";

// Screens
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import CreateExperienceScreen from "./screens/CreateExperienceScreen";
import SearchScreen from "./screens/SearchScreen"; 
import ProfileScreen from "./screens/ProfileScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import ViewExperienceScreen from "./screens/ViewExperienceScreen";
import SafeZoneScreen from "./screens/SafeZoneScreen"; 

// Components
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";

function AppContent() {
  const { user } = useAuth();
  
  const [screen, setScreen] = useState(SCREENS.HOME);
  const [activeExperience, setActiveExperience] = useState<any>(null);
  const [targetCommentId, setTargetCommentId] = useState<string | undefined>(undefined);
  const [previousScreen, setPreviousScreen] = useState<string>(SCREENS.HOME);

  if (!user) {
    return <LoginScreen />;
  }

  const openFromNotification = (exp: any, commentId?: string) => {
    setActiveExperience(exp);
    setTargetCommentId(commentId);
    setPreviousScreen(SCREENS.NOTIFICATIONS);
    setScreen(SCREENS.VIEW_EXPERIENCE);
  };

  const openFromHome = (exp: any) => {
    setActiveExperience(exp);
    setTargetCommentId(undefined);
    setPreviousScreen(SCREENS.HOME);
    setScreen(SCREENS.VIEW_EXPERIENCE);
  };

  const handleBackFromView = () => {
    setScreen(previousScreen);
    setTargetCommentId(undefined);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white font-sans overflow-hidden">
      
      {screen !== SCREENS.VIEW_EXPERIENCE && (
        <div className="shrink-0 z-50">
            <AppHeader screen={screen} onBack={setScreen} />
        </div>
      )}

      {/* ✅ Η ΜΑΓΙΚΗ ΑΛΛΑΓΗ: Προστέθηκε το min-h-0. Αυτό φτιάχνει το scroll! */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {screen === SCREENS.HOME && (
            <HomeScreen onNavigate={setScreen} onOpenExperience={openFromHome} />
        )}
        
        {screen === SCREENS.CREATE && (
          <CreateExperienceScreen onNavigate={setScreen} />
        )}
        
        {screen === SCREENS.PROFILE && (
          <ProfileScreen 
              onBack={() => setScreen(SCREENS.HOME)} 
              onOpenExperience={openFromHome} 
          />
        )}

        {screen === SCREENS.SEARCH && <SearchScreen onOpenExperience={openFromHome} />}

        {screen === SCREENS.NOTIFICATIONS && (
            <NotificationsScreen 
                onNavigate={setScreen} 
                onOpenExperience={openFromNotification} 
            />
        )}

        {screen === SCREENS.SAFE_ZONE && (
            <SafeZoneScreen />
        )}

        {screen === SCREENS.VIEW_EXPERIENCE && activeExperience && (
            <ViewExperienceScreen 
                experience={activeExperience} 
                onBack={handleBackFromView}
                highlightCommentId={targetCommentId} 
            />
        )}
      </div>

      {screen !== SCREENS.VIEW_EXPERIENCE && 
       screen !== SCREENS.CREATE && 
       screen !== SCREENS.NOTIFICATIONS && (
        <BottomNav current={screen} onNavigate={setScreen} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}