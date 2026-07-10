import { useNavigate } from "react-router-dom";
import { Button, Card, Logo } from "../components/ui";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8 bg-cream-50 text-graphite-800">
      <div className="mb-6 text-center animate-fade-in">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-cream-200">
          <Logo className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-graphite-900">Política de Privacidade</h1>
        <p className="mt-1.5 text-xs font-semibold text-graphite-500">
          Aplicativo Markt — Última atualização: Julho de 2026
        </p>
      </div>

      <Card className="p-6 space-y-5 text-sm leading-relaxed text-justify">
        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">1. Introdução</h2>
          <p>
            Esta Política de Privacidade descreve como o aplicativo <strong>Markt</strong> ("nós", "nosso"), de responsabilidade do administrador <strong>Heitor Silvio Lins dos Santos</strong>, coleta, usa, armazena e protege as informações de nossos usuários. 
          </p>
          <p>
            Ao utilizar o Markt, você concorda com os termos descritos nesta política. Se não concordar, por favor, não utilize o aplicativo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">2. Informações que Coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Informações de Cadastro:</strong> Coletamos seu Nome e CPF para fins de criação de conta, autenticação e segurança de login.
            </li>
            <li>
              <strong>Dados Financeiros e de Compras:</strong> Registramos suas listas de compras, itens adquiridos, preços, formas de pagamento utilizadas e os limites de orçamentos (crédito e débito) configurados na Carteira.
            </li>
            <li>
              <strong>Dados de Estabelecimentos:</strong> Salvamos as informações dos mercados por você cadastrados ou selecionados (nome e localização).
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">3. Uso das Permissões do Dispositivo</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Câmera:</strong> Solicitamos acesso à câmera exclusivamente para a funcionalidade de leitura de códigos de barras de produtos.
            </li>
            <li>
              <strong>Lanterna:</strong> Utilizamos a lanterna para auxiliar na leitura de códigos de barras em ambientes de baixa luminosidade.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">4. Serviços de Terceiros</h2>
          <p>
            O Markt utiliza o <strong>Mercado Pago</strong> para o processamento e gestão das assinaturas de planos mensais e anuais. Não armazenamos seus dados de pagamento (como números de cartão de crédito) em nossos servidores.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">5. Criptografia e Armazenamento</h2>
          <p>
            Todas as comunicações entre o aplicativo no seu dispositivo e o nosso banco de dados são criptografadas em trânsito através de conexões seguras utilizando o protocolo <strong>HTTPS (SSL/TLS)</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">6. Retenção e Exclusão de Dados</h2>
          <p>
            Seus dados permanecem salvos e associados à sua conta para preservar seu histórico e relatórios. Se desejar suspender o uso sem perder o histórico, basta manter a conta inativa.
          </p>
          <p className="bg-clay-50 border border-clay-200 text-clay-950 p-3 rounded-2xl text-xs font-semibold">
            ⚠️ <strong>Exclusão Permanente:</strong> A qualquer momento, você pode solicitar a exclusão definitiva da sua conta diretamente no menu de Perfil do aplicativo. Esta ação é irreversível e apagará permanentemente seu cadastro, listas de compras, itens e limites financeiros de nossos servidores.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-graphite-900 text-base">7. Contato e Suporte (SAC)</h2>
          <p>
            Caso possua dúvidas sobre esta política ou queira fazer solicitações relacionadas aos seus dados, entre em contato com nosso suporte através do e-mail: 
            <a href="mailto:linnsheitor@gmail.com" className="text-forest-600 hover:text-forest-750 underline ml-1 font-bold">
              linnsheitor@gmail.com
            </a>
          </p>
        </section>
      </Card>

      <div className="mt-6 text-center">
        <Button onClick={() => navigate("/login")} variant="secondary" className="px-8 shadow-sm">
          Voltar para o Login
        </Button>
      </div>
    </div>
  );
}
