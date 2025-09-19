// Save this as src/pages/AuthDebug.tsx
import AuthDebugger from '@/components/auth/AuthDebugger';

export default function AuthDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Authentication Debugging</h1>
      <AuthDebugger />
    </div>
  );
}