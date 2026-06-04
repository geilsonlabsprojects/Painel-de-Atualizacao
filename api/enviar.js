import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 1. CONFIGURAÇÃO DE CORS (Evita o erro "Access to fetch blocked by CORS")
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite pedidos de qualquer domínio (incluindo o seu GitHub Pages)
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Resposta rápida para o "Preflight" do navegador
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Apenas aceitar pedidos POST
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido. Utilize o método POST.' });
    }

    // 2. CAPTURA DOS DADOS ENVIADOS PELO PAINEL
    const { emailCliente, nomeCliente, protocolo, textoSolicitacao } = req.body;

    // Validação básica
    if (!emailCliente || !protocolo) {
        return res.status(400).json({ erro: 'O email do cliente e o protocolo são obrigatórios.' });
    }

    try {
        // 3. CONFIGURAÇÃO DO SERVIÇO DE E-MAIL (Nodemailer)
        // Utiliza as Variáveis de Ambiente da Vercel para não expor a sua password no código
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Pode usar 'gmail', 'outlook', etc.
            auth: {
                user: process.env.EMAIL_USER, // O seu e-mail (ex: seuemail@gmail.com)
                pass: process.env.EMAIL_PASS  // A Senha de Aplicação (App Password) gerada no Google
            }
        });

        // 4. CONSTRUÇÃO DO CORPO DO E-MAIL (Igual ao modelo do seu painel)
        const dataConclusao = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' });
        
        const mensagemTexto = `Olá, ${nomeCliente || 'Estudante'},

Agradecemos o seu contato através da Central de Ajuda e Suporte do Portal Escolar.
Recebemos a seguinte solicitação:
"${textoSolicitacao || 'Solicitação de suporte'}"

Após análise e verificação realizada por nossa equipe, informamos que a solicitação foi atendida com sucesso.
✅ Status do atendimento: Resolvido

O procedimento necessário foi concluído e a situação foi regularizada.
Caso ainda encontre alguma dificuldade ou necessite de suporte adicional, responda a esta mensagem ou abra um novo atendimento em nossa Central de Ajuda.

Dados do atendimento:
• Protocolo: ${protocolo}
• Data de conclusão: ${dataConclusao}

Agradecemos a sua colaboração e permanecemos à disposição.

Atenciosamente,
Equipe de Suporte Técnico
Portal Escolar – Central de Ajuda e Suporte`;

        // Configuração final do E-mail
        const mailOptions = {
            from: `"Portal Escolar - Suporte" <${process.env.EMAIL_USER}>`,
            to: emailCliente,
            subject: `Suporte Técnico - Protocolo ${protocolo} (Resolvido)`,
            text: mensagemTexto
        };

        // 5. ENVIO DO E-MAIL
        await transporter.sendMail(mailOptions);

        // Retorna sucesso para o seu painel
        return res.status(200).json({ 
            sucesso: true, 
            mensagem: `E-mail de resolução enviado com sucesso para ${emailCliente}` 
        });

    } catch (error) {
        console.error('Erro detalhado do nodemailer:', error);
        return res.status(500).json({ 
            erro: 'Falha interna ao tentar enviar o e-mail.', 
            detalhes: error.message 
        });
    }
}
