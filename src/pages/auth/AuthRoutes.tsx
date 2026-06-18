import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ResetPasswordPage from "./ResetPasswordPage";
import VerifyEmailPage from "./VerifyEmailPage";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
