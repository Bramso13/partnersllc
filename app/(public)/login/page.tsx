import LoginForm from "@/components/auth/LoginForm";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connexion - Partners LLC",
  description: "Connectez-vous à votre compte Partners LLC",
};

interface LoginPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #2d2d2d 50%, #000000 100%)",
        }}
      />

      {/* Floating Shapes */}
      <div
        className="floating-shape absolute w-[672px] h-[694px] right-[-200px] top-[-100px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div
        className="floating-shape absolute w-[689px] h-[690px] left-[-250px] bottom-[-200px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out 5s",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
        <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
          {/* Logo Section */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <Image
                src="/logo_partnersllc_blanc.png"
                alt="PARTNERS LLC Logo"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bienvenue
            </h2>
            <p className="text-text-secondary">
              Connectez-vous à votre espace PARTNERS
            </p>
          </div>

          {message === "payment_cancelled" && (
            <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded mb-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-exclamation-triangle mt-0.5"></i>
                <div>
                  <p className="font-semibold mb-1">Paiement annulé</p>
                  <p className="text-sm">
                    Veuillez vous connecter pour réessayer de payer et finaliser
                    votre inscription.
                  </p>
                </div>
              </div>
            </div>
          )}

          <LoginForm />

          {/* Divider */}
          {/* <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#363636] text-text-secondary">
                Ou se connecter avec
              </span>
            </div>
          </div>

          {/* Social Login */}
          {/* <div className="grid grid-cols-3 gap-4 mb-8">
            <button className="social-btn bg-surface border border-border rounded-md py-3 flex items-center justify-center gap-2 hover:bg-border transition-all">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.7 5.83999 14.1H2.17999V16.94C3.98999 20.53 7.69999 23 12 23Z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.1C5.62 13.44 5.49 12.73 5.49 12C5.49 11.27 5.62 10.56 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.37C13.62 5.37 15.06 5.91 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.69999 1 3.98999 3.47 2.17999 7.06L5.83999 9.9C6.70999 7.3 9.13999 5.37 12 5.37Z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <button className="social-btn bg-surface border border-border rounded-md py-3 flex items-center justify-center gap-2 hover:bg-border transition-all">
              <svg
                width="24"
                height="24"
                viewBox="0 0 34 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M34 16.5C34 7.38736 26.3888 0 17 0C7.61122 0 0 7.38723 0 16.5C0 24.7356 6.21669 31.5618 14.3438 32.7996V21.2695H10.0273V16.5H14.3438V12.8648C14.3438 8.72953 16.8818 6.44531 20.7648 6.44531C22.6249 6.44531 24.5703 6.76758 24.5703 6.76758V10.8281H22.4267C20.3147 10.8281 19.6562 12.1 19.6562 13.405V16.5H24.3711L23.6174 21.2695H19.6562V32.7996C27.7833 31.5618 34 24.7357 34 16.5Z"
                  fill="#1877F2"
                />
                <path
                  d="M23.6174 21.2695L24.3711 16.5H19.6562V13.405C19.6562 12.0999 20.3149 10.8281 22.4267 10.8281H24.5703V6.76758C24.5703 6.76758 22.6249 6.44531 20.7648 6.44531C16.8818 6.44531 14.3438 8.72953 14.3438 12.8648V16.5H10.0273V21.2695H14.3438V32.7996C15.2225 32.9332 16.1106 33.0002 17 33C17.8894 33.0003 18.7775 32.9332 19.6562 32.7996V21.2695H23.6174Z"
                  fill="white"
                />
              </svg>
            </button>
            <button className="social-btn bg-surface border border-border rounded-md py-3 flex items-center justify-center gap-2 hover:bg-border transition-all">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.8407 1.48093C18.3212 0.783414 16.7176 0.286019 15.0701 0.00120838C15.0552 -0.00156145 15.0397 0.000458389 15.0259 0.00698004C15.0122 0.0135017 15.0008 0.0241935 14.9935 0.0375367C14.7875 0.403865 14.5592 0.88199 14.3995 1.25769C12.5979 0.987927 10.8058 0.987927 9.0413 1.25769C8.88145 0.873552 8.64497 0.403865 8.43801 0.0375367C8.43035 0.0244673 8.41893 0.0140103 8.40524 0.0075299C8.39155 0.00104945 8.37622 -0.0011537 8.36126 0.00120838C6.71361 0.285444 5.10995 0.782861 3.59067 1.48093C3.57767 1.48646 3.56669 1.49587 3.55926 1.50789C0.520827 6.04726 -0.311439 10.4751 0.0968426 14.848C0.0979789 14.8588 0.101262 14.8691 0.106497 14.8786C0.111732 14.888 0.118811 14.8963 0.127311 14.9029C2.13192 16.3751 4.07383 17.2689 5.97966 17.8613C5.99448 17.8657 6.0103 17.8655 6.025 17.8607C6.03971 17.8559 6.05259 17.8467 6.06192 17.8343C6.51274 17.2186 6.91458 16.5695 7.25923 15.8869C7.26397 15.8776 7.26668 15.8673 7.26718 15.8568C7.26767 15.8464 7.26594 15.8359 7.2621 15.8262C7.25826 15.8164 7.25239 15.8076 7.24488 15.8002C7.23738 15.7929 7.22841 15.7873 7.21856 15.7837C6.58106 15.5418 5.97415 15.2471 5.39032 14.9123C5.37969 14.906 5.37076 14.8972 5.36432 14.8867C5.35788 14.8762 5.35413 14.8642 5.3534 14.8519C5.35267 14.8396 5.35498 14.8273 5.36014 14.816C5.36529 14.8048 5.37312 14.7951 5.38294 14.7876C5.5061 14.6955 5.62714 14.6006 5.74598 14.503C5.75639 14.4944 5.76899 14.4889 5.78236 14.4871C5.79574 14.4853 5.80936 14.4872 5.82169 14.4927C9.65747 16.244 13.81 16.244 17.6004 14.4927C17.6128 14.4869 17.6266 14.4846 17.6402 14.4863C17.6538 14.488 17.6666 14.4934 17.6772 14.5021C17.7961 14.6003 17.9175 14.6954 18.0412 14.7876C18.051 14.795 18.0589 14.8047 18.0642 14.8159C18.0694 14.827 18.0718 14.8393 18.0712 14.8516C18.0705 14.864 18.0669 14.8759 18.0605 14.8865C18.0542 14.8971 18.0453 14.9059 18.0347 14.9123C17.4506 15.2533 16.8387 15.5445 16.2056 15.7827C16.1957 15.7865 16.1868 15.7923 16.1794 15.7997C16.1719 15.8072 16.1661 15.8161 16.1624 15.8259C16.1586 15.8358 16.157 15.8463 16.1576 15.8568C16.1582 15.8673 16.161 15.8776 16.1658 15.8869C16.5164 16.5641 16.9163 17.2147 17.3621 17.8334C17.3712 17.8461 17.384 17.8556 17.3987 17.8606C17.4135 17.8656 17.4294 17.8658 17.4443 17.8613C19.3594 17.2689 21.3013 16.3751 23.3061 14.9029C23.3147 14.8966 23.3218 14.8885 23.3271 14.8792C23.3323 14.8699 23.3355 14.8596 23.3365 14.849C23.8252 9.7934 22.518 5.40179 19.8712 1.50883C19.8647 1.49618 19.8539 1.48628 19.8407 1.48093ZM7.83204 12.1854C6.67716 12.1854 5.72559 11.1252 5.72559 9.82316C5.72559 8.52109 6.65876 7.4609 7.83204 7.4609C9.01446 7.4609 9.95676 8.53047 9.93825 9.82316C9.93825 11.1252 9.00532 12.1854 7.83204 12.1854ZM15.6198 12.1854C14.465 12.1854 13.5135 11.1252 13.5135 9.82316C13.5135 8.52109 14.4466 7.4609 15.6198 7.4609C16.8023 7.4609 17.7446 8.53047 17.7262 9.82316C17.7262 11.1252 16.8023 12.1854 15.6198 12.1854Z"
                  fill="#5865F2"
                />
              </svg>
            </button>
          </div> */}

          {/* Register Link */}
          {/* <div className="text-center">
            <p className="text-sm text-text-secondary">
              Vous n&apos;avez pas de compte ?{" "}
              <Link
                href="/register"
                className="text-accent font-semibold hover:underline ml-1"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
