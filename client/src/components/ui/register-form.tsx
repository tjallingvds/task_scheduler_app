import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, signInWithGithub } from "@/lib/firebase";
import { ChromeIcon, GithubIcon } from "lucide-react";

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, loginWithFirebase, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(email, password, name);
      navigate("/"); // Redirect to dashboard after registration
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGoogle();
      await loginWithFirebase(user);
      navigate("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      const user = await signInWithGithub();
      await loginWithFirebase(user);
      navigate("/");
    } catch (error) {
      console.error("GitHub Sign-In Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your information below to create your account
        </p>
      </div>
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            type="text" 
            placeholder="John Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div><Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <ChromeIcon className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleGitHubSignIn}
            disabled={isLoading}
          >
            <GithubIcon className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a 
          href="/login" 
          className="underline underline-offset-4"
          onClick={(e) => {
            e.preventDefault();
            navigate("/login");
          }}
        >
          Login
        </a>
      </div>
    </form>
  );
}