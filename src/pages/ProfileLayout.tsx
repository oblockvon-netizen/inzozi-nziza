import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AccountSkeleton } from "@/components/ux/skeletons/AccountSkeleton";
import { AccountLayout } from "@/components/account/AccountLayout";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

export default function ProfileLayout() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth/login", { replace: true });
    } catch (error) {
      console.error(error instanceof ApiError ? error.message : "Sign out failed");
    }
  };

  if (loading) {
    return <AccountSkeleton />;
  }

  if (!user) {
    return <LoadingSpinner message="Loading account..." />;
  }

  return (
    <AccountLayout user={user} onSignOut={handleSignOut} title="Profile">
      <Outlet />
    </AccountLayout>
  );
}
