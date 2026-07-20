import { getLoginUrl } from "@/const";
import { Facebook, Mail, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

// Ícones SVG inline para Google, Microsoft e Apple
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

const LOGIN_METHODS = [
  {
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    label: "Facebook",
    desc: "Entre com sua conta do Facebook. Rápido e seguro.",
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    icon: <GoogleIcon />,
    label: "Google",
    desc: "Use sua conta Google (Gmail). A opção mais comum.",
    color: "border-red-200 bg-red-50 hover:bg-red-100",
    textColor: "text-red-700",
  },
  {
    icon: <MicrosoftIcon />,
    label: "Microsoft",
    desc: "Entre com conta Microsoft, Outlook ou Hotmail.",
    color: "border-blue-200 bg-sky-50 hover:bg-sky-100",
    textColor: "text-sky-700",
  },
  {
    icon: <AppleIcon />,
    label: "Apple",
    desc: "Use seu Apple ID (iPhone, iPad ou Mac).",
    color: "border-gray-200 bg-gray-50 hover:bg-gray-100",
    textColor: "text-gray-700",
  },
  {
    icon: <Mail className="w-6 h-6 text-orange-600" />,
    label: "E-mail (link mágico)",
    desc: "Digite seu e-mail e receba um link de acesso na sua caixa de entrada. Não precisa de senha!",
    color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
    textColor: "text-orange-700",
    highlight: true,
    note: "Após clicar em 'Continue', verifique sua caixa de entrada (e a pasta de spam). Clique no link recebido para entrar automaticamente.",
  },
];

export default function LoginGuide() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">Como entrar na sua conta</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Escolha uma das formas abaixo para fazer login. Você será redirecionado para uma tela segura.
          </p>
        </div>

        {/* Métodos */}
        <div className="flex flex-col gap-3 mb-8">
          {LOGIN_METHODS.map((method) => (
            <a
              key={method.label}
              href={getLoginUrl()}
              className={`rounded-2xl border p-4 transition-colors cursor-pointer block ${method.color} ${method.highlight ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{method.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${method.textColor}`}>{method.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{method.desc}</p>
                  {method.note && (
                    <div className="mt-2 bg-white/70 rounded-xl px-3 py-2 flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-orange-700 leading-relaxed font-medium">{method.note}</p>
                    </div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              </div>
            </a>
          ))}
        </div>

        {/* Aviso geral */}
        <div className="bg-secondary rounded-2xl p-4 mb-6 text-sm text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Importante:</span> Ao entrar, você concorda com nossos termos de uso. Seus dados são protegidos e nunca compartilhados com terceiros.
          </p>
        </div>

        {/* Botão principal */}
        <a
          href={getLoginUrl()}
          className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity text-base shadow-lg"
        >
          Ir para a tela de login
          <ArrowRight className="w-5 h-5" />
        </a>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Acesso seguro via Manus Auth — seus dados estão protegidos
        </p>
      </div>
    </div>
  );
}
