# Aether AI - Um Chat App com Next.js, React Router e Convex

E aí, galera! 👋 Hoje vou compartilhar com vocês a minha experiência na criação do Aether AI, um chat app super maneiro que mistura o melhor de vários mundos: Next.js, React Router e Convex. Vou contar como foi esse processo e mostrar algumas partes do código que achei mais interessantes.

## O Que é o Aether AI?

O Aether AI é uma aplicação de chat moderna com autenticação, streaming de mensagens em tempo real, e várias funcionalidades bacanas como chat por voz, upload de arquivos, e uma interface super amigável. É basicamente aquele chat app que você sempre quis desenvolver!

## O Desafio: Next.js + React Router + Convex

Sabe quando alguém diz "isso não vai dar certo"? Foi exatamente o que ouvi quando falei que queria usar React Router dentro do Next.js junto com o Convex como backend. E sim, foi um desafio e tanto!

### Por que essa combinação maluca?

- **Next.js**: Para ter aquele SSR/SSG delicinha e toda a infraestrutura robusta
- **React Router**: Porque eu amo o sistema de rotas dele e queria controle total sobre a navegação
- **Convex**: Para ter um backend reativo em tempo real sem precisar configurar websockets

## Como eu fiz essa maluquice funcionar

A parte mais doida foi fazer o React Router funcionar dentro do Next.js. Normalmente isso seria considerado um crime contra a humanidade do frontend, mas a gente não tem medo de desafios, né? 😎

Vamos dar uma olhada em como ficou essa estrutura:

```30:35:app/App.tsx
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
```

No componente principal, eu uso o BrowserRouter do React Router para gerenciar as rotas do cliente:

```47:67:app/App.tsx
return (
  <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES
          These routes are accessible to everyone.
        */}
        <Route
          path="/auth"
          element={!user ? <LoginPage /> : <Navigate to="/chat" replace />}
        />
        <Route path="/shared/:shareId" element={<SharedChatPage />} />

        {/* PROTECTED ROUTES
          This group of routes requires an authenticated user.
          The <ProtectedRoute> component handles the auth check.
        */}
        <Route element={<ProtectedRoute />}>
          {/* Routes with the main sidebar layout.
            The <MainLayout> component renders the sidebar and an <Outlet />
            for the nested routes below.
          */}
          <Route element={<SidebarLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/debug/google" element={<DebugGoogle />} />
          </Route>
```

### Proteção de Rotas

Uma coisa maneira é como implementei a proteção de rotas usando React Router e Convex juntos:

```1:20:components/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";


const ProtectedRoute = () => {
  const user = useQuery(api.myFunctions.getUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
```

## Autenticação com NextAuth e Convex

Integrar o NextAuth com o Convex foi outro perrengue delicioso. Precisei criar um adaptador personalizado para fazer os dois conversarem:

```10:30:auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          // Minimal scopes for login. Additional scopes can be requested later via signIn("github", { scope: "repo" })
          scope: "read:user user:email",
        },
      },
    }),
    Resend({
      name: "email",
      from: "My App <onboarding@resend.dev>",
    }),
    // --- 2. ADD AND CONFIGURE GOOGLE PROVIDER ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent", // Important for re-asking for permissions
          access_type: "offline", // This is crucial for getting refresh tokens
          response_type: "code",
```

E depois criei um adaptador para o Convex que gerencia todos os usuários e sessões:

```5:15:app/ConvexAdapter.ts
type User = AdapterUser & { id: Id<"users"> };
type Session = AdapterSession & { userId: Id<"users"> };
type Account = AdapterAccount & { userId: Id<"users"> };
type Authenticator = AdapterAuthenticator & { userId: Id<"users"> };

// 1. Simplest form, a plain object.
export const ConvexAdapter: Adapter = {
  async createAuthenticator(authenticator: Authenticator) {
    await callMutation(api.authAdapter.createAuthenticator, { authenticator } as any);
    return authenticator;
  },
```

## A Interface de Chat

Uma das partes mais legais do projeto é a interface de chat, que usa streaming em tempo real com o Convex:

```1:20:app/hooks/use-convex-chat.ts
import { useMemo, useEffect } from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const useConvexChat = (chatId?: Id<"chats">) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // First get the user's chats to verify access
  const chats = useQuery(
    api.chat.queries.getUserChats,
    isAuthenticated ? {} : "skip"
  );

  // Only query messages if the chat exists in the user's chats
  const chatExists = useMemo(() => {
    if (!chatId || !chats) return false;
    return chats.some((chat) => chat._id === chatId);
  }, [chatId, chats]);
```

## Modelos de IA Suportados

Uma das partes mais legais do Aether AI é a diversidade de modelos de IA que consegui integrar! Criei um sistema flexível que permite usar vários modelos diferentes:

```1:20:lib/models.tsx
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  vendor: 'google' | 'anthropic' | 'openai' | 'deepseek' | 'meta' | 'sarvam' | 'qwen',
  provider:
    | "gemini"
    | "openrouter"
    | "groq"
    | "google"
    | "anthropic"
    | "openai"
    | "deepseek";
  category:
    | "google"
    | "anthropic"
    | "openai"
    | "deepseek"
    | "meta"
    | "sarvam"
    | "qwen";
  features: ("vision" | "web" | "code" | "imagegen" | "weather" | "googledrive")[];
  isPro?: boolean;
  isNew?: boolean;
  supportsThinking?: boolean;
  unauthenticated?: boolean;
  attachmentsSuppport: {
    pdf: boolean;
    image: boolean;
  };
  isApiKeyOnly?: boolean;
  toolCalls?: boolean;
  isFree?: boolean;
}
```

O app suporta vários modelos de diferentes fornecedores:

- **Google Gemini**: Desde o Flash até o Gemini 2.5 Pro
- **Anthropic Claude**: Incluindo o Claude 3.5 Sonnet e Haiku
- **OpenAI**: GPT-4o e GPT-4.1-mini
- **Meta**: Toda a família Llama 3.2 e 3.3
- **Deepseek**: Modelos como DeepSeek R1 e Chat V3
- **Qwen**: Modelos como Qwen 3.2B

Cada modelo tem suas próprias capacidades especiais, como processamento de visão, geração de imagens, busca na web e muito mais. Isso permite que os usuários escolham o modelo que melhor atende às suas necessidades.

## Integração com Notion e Google Drive (Em Desenvolvimento)

Estou trabalhando em uma integração bacana com Notion e Google Drive, que vai permitir:

### Google Drive

```183:184:lib/models.tsx
  features: ["vision", "web", "code", "imagegen", "weather", "googledrive"],
```

- Acessar arquivos diretamente do Google Drive
- Fazer perguntas sobre documentos armazenados na nuvem
- Permitir que a IA processe e analise arquivos sem precisar fazer upload
- Gerar resumos e extrair informações importantes

### Notion

```37:48:auth.ts
// --- NOTION PROVIDER ---
Notion({
  clientId: process.env.NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
  authorization: {
    params: {
      scope:
        "databases:read databases:write pages:read pages:write blocks:read blocks:write users:read",
    },
  },
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/notion`,
} as any),
```

- Criar notas diretamente no Notion a partir das conversas
- Salvar trechos de código ou respostas importantes em páginas do Notion
- Consultar bases de conhecimento armazenadas no Notion
- Atualizar e organizar informações no Notion usando comandos de chat

Essa integração vai tornar o Aether AI não apenas um chatbot, mas uma ferramenta completa de produtividade que se conecta com seus aplicativos favoritos!

## O Resultado Final

No final das contas, consegui fazer essa combinação esquisita funcionar surpreendentemente bem! O app tem:

- Autenticação com múltiplos provedores
- Chat em tempo real com streaming
- Interface responsiva e bonita
- Upload de arquivos
- Chat por voz
- Proteção de rotas
- Suporte a dezenas de modelos de IA diferentes
- Integrações com serviços externos (em desenvolvimento)

## O Que Aprendi

Essa jornada me ensinou muito sobre:

1. **Integração de tecnologias**: Às vezes o "jeito não recomendado" pode ser exatamente o que você precisa
2. **Adaptar bibliotecas**: Criar adaptadores personalizados para fazer sistemas diferentes conversarem
3. **Pensar fora da caixa**: Não ter medo de tentar combinações não convencionais

## Conclusão

Foi um baita desafio fazer o Next.js, React Router e Convex trabalharem juntos harmoniosamente, mas o resultado valeu a pena! Espero que essa experiência inspire vocês a também não terem medo de experimentar combinações "proibidas" nas suas aplicações.

Se quiserem conferir o código completo ou contribuir, fiquem à vontade! E se tiverem alguma pergunta ou sugestão, é só falar nos comentários.

Valeu, galera! 👋
