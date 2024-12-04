import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useNavigationGuard(hasUnsavedChanges) {
  const location = useLocation();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleLocationChange = () => {
      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [hasUnsavedChanges, location]);
}
