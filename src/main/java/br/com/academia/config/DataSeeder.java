package br.com.academia.config;

import br.com.academia.model.*;
import br.com.academia.repository.*;
import br.com.academia.service.MensalidadeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final PlanoRepository planoRepository;
    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final FichaTreinoRepository fichaRepository;
    private final AvaliacaoFisicaRepository avaliacaoRepository;
    private final MensalidadeService mensalidadeService;

    @Value("${academia.dados-exemplo:true}")
    private boolean habilitado;

    public DataSeeder(PlanoRepository planoRepository, AlunoRepository alunoRepository,
                      ProfessorRepository professorRepository, MensalidadeRepository mensalidadeRepository,
                      FichaTreinoRepository fichaRepository, AvaliacaoFisicaRepository avaliacaoRepository,
                      MensalidadeService mensalidadeService) {
        this.planoRepository = planoRepository;
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
        this.mensalidadeRepository = mensalidadeRepository;
        this.fichaRepository = fichaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.mensalidadeService = mensalidadeService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!habilitado || planoRepository.count() > 0) {
            return;
        }
        log.info("Banco vazio: inserindo dados de exemplo...");
        LocalDate hoje = LocalDate.now();

        Plano mensal = planoRepository.save(new Plano("Mensal",
                "Acesso livre à musculação e aulas coletivas, sem fidelidade.", new BigDecimal("129.90"), 1));
        planoRepository.save(new Plano("Bimestral",
                "Musculação + aulas coletivas com 2 meses de fidelidade.", new BigDecimal("129.90"), 2));
        Plano trimestral = planoRepository.save(new Plano("Trimestral",
                "Musculação + aulas coletivas com 3 meses de fidelidade.", new BigDecimal("114.90"), 3));
        Plano semestral = planoRepository.save(new Plano("Semestral",
                "Musculação + aulas coletivas + 1 avaliação física por trimestre.", new BigDecimal("99.90"), 6));
        Plano anual = planoRepository.save(new Plano("Anual",
                "Melhor custo-benefício: tudo do semestral + acompanhamento mensal.", new BigDecimal("89.90"), 12));
        Plano promo = new Plano("Promocional Verão", "Campanha encerrada.", new BigDecimal("79.90"), 2);
        promo.setAtivo(false);
        planoRepository.save(promo);

        Professor lucas = professor("Lucas Ferreira", "52601815906", "012345-G/RJ",
                "Musculação e hipertrofia", hoje.minusYears(3));
        Professor mariana = professor("Mariana Rocha", "08301661305", "023456-G/RJ",
                "Treinamento funcional e emagrecimento", hoje.minusYears(2));
        Professor thiago = professor("Thiago Mendes", "18609139034", "034567-G/RJ",
                "Avaliação física e reabilitação", hoje.minusMonths(8));

        Aluno ana = aluno("Ana Beatriz Souza", "99603082430", "ana.souza@email.com", "(24) 99811-2233",
                LocalDate.of(1998, 4, 12), hoje.minusDays(75), trimestral);
        pagarAte(ana, hoje.minusDays(20), FormaPagamento.PIX, 0);

        Aluno carlos = aluno("Carlos Eduardo Lima", "62819482112", "carlos.lima@email.com", "(24) 99722-3344",
                LocalDate.of(1990, 9, 3), hoje.minusDays(62), mensal);
        mensalidadeService.gerarParaAluno(carlos, 2, carlos.getDataMatricula().plusMonths(1));
        pagarAte(carlos, hoje, FormaPagamento.CARTAO_CREDITO, 0);

        Aluno juliana = aluno("Juliana Martins", "99351819019", "juliana.m@email.com", "(24) 99633-4455",
                LocalDate.of(2001, 1, 27), hoje.minusDays(20), semestral);
        pagarAte(juliana, hoje, FormaPagamento.CARTAO_DEBITO, 0);

        Aluno rafael = aluno("Rafael Oliveira", "93786579741", "rafael.oliveira@email.com", "(24) 99544-5566",
                LocalDate.of(1985, 6, 18), hoje.minusDays(125), anual);
        pagarAte(rafael, hoje.minusDays(40), FormaPagamento.BOLETO, 2);

        Aluno fernanda = aluno("Fernanda Costa", "54323194897", "fe.costa@email.com", "(24) 99455-6677",
                LocalDate.of(1995, 11, 30), hoje.minusDays(38), mensal);
        mensalidadeService.gerarParaAluno(fernanda, 1, fernanda.getDataMatricula().plusMonths(1));
        pagarAte(fernanda, hoje.minusDays(30), FormaPagamento.DINHEIRO, 6);

        Aluno pedro = aluno("Pedro Henrique Alves", "75749118606", "pedro.alves@email.com", "(24) 99366-7788",
                LocalDate.of(2003, 2, 14), hoje.minusDays(210), mensal);
        pagarAte(pedro, hoje, FormaPagamento.PIX, 0);
        pedro.setAtivo(false);

        FichaTreino a = ficha(ana, lucas, "Treino A - Membros superiores", "Hipertrofia", hoje.minusDays(70));
        a.adicionarItem(new ItemTreino(1, "Supino reto com barra", "Peito", 4, "8-10", 30.0, 90, null));
        a.adicionarItem(new ItemTreino(2, "Crucifixo com halteres", "Peito", 3, "12", 8.0, 60, null));
        a.adicionarItem(new ItemTreino(3, "Puxada frontal", "Costas", 4, "10", 35.0, 90, "Pegada aberta"));
        a.adicionarItem(new ItemTreino(4, "Remada baixa", "Costas", 3, "12", 30.0, 60, null));
        a.adicionarItem(new ItemTreino(5, "Desenvolvimento com halteres", "Ombros", 3, "10", 7.0, 60, null));
        a.adicionarItem(new ItemTreino(6, "Tríceps corda", "Tríceps", 3, "12-15", 15.0, 45, null));
        fichaRepository.save(a);

        FichaTreino b = ficha(ana, lucas, "Treino B - Membros inferiores", "Hipertrofia", hoje.minusDays(70));
        b.adicionarItem(new ItemTreino(1, "Agachamento livre", "Quadríceps", 4, "8-10", 40.0, 120, "Manter a lombar neutra"));
        b.adicionarItem(new ItemTreino(2, "Leg press 45", "Quadríceps", 4, "12", 100.0, 90, null));
        b.adicionarItem(new ItemTreino(3, "Stiff", "Posteriores", 3, "10", 30.0, 90, null));
        b.adicionarItem(new ItemTreino(4, "Cadeira abdutora", "Glúteos", 3, "15", 40.0, 45, null));
        b.adicionarItem(new ItemTreino(5, "Panturrilha em pé", "Panturrilha", 4, "15-20", 30.0, 45, null));
        fichaRepository.save(b);

        FichaTreino full = ficha(carlos, mariana, "Full Body - Iniciante", "Condicionamento", hoje.minusDays(60));
        full.adicionarItem(new ItemTreino(1, "Esteira (aquecimento)", "Cardio", 1, "10 min", null, 0, "Ritmo moderado"));
        full.adicionarItem(new ItemTreino(2, "Agachamento no smith", "Quadríceps", 3, "12", 20.0, 60, null));
        full.adicionarItem(new ItemTreino(3, "Supino máquina", "Peito", 3, "12", 25.0, 60, null));
        full.adicionarItem(new ItemTreino(4, "Remada máquina", "Costas", 3, "12", 25.0, 60, null));
        full.adicionarItem(new ItemTreino(5, "Prancha abdominal", "Core", 3, "30 s", null, 30, null));
        fichaRepository.save(full);

        FichaTreino rafa = ficha(rafael, mariana, "Funcional - Emagrecimento", "Emagrecimento", hoje.minusDays(120));
        rafa.adicionarItem(new ItemTreino(1, "Burpee", "Corpo inteiro", 4, "12", null, 45, null));
        rafa.adicionarItem(new ItemTreino(2, "Kettlebell swing", "Posteriores", 4, "15", 12.0, 45, null));
        rafa.adicionarItem(new ItemTreino(3, "Corda naval", "Cardio", 4, "30 s", null, 30, null));
        rafa.adicionarItem(new ItemTreino(4, "Afundo alternado", "Quadríceps", 3, "12 cada", 6.0, 45, null));
        rafa.setDataFim(hoje.minusDays(30));
        rafa.setAtiva(false);
        fichaRepository.save(rafa);

        avaliacao(ana, thiago, hoje.minusDays(74), 68.4, 1.65, 29.5, 74.0, 98.0, 27.0, 56.0);
        avaliacao(ana, thiago, hoje.minusDays(40), 66.9, 1.65, 27.2, 72.0, 97.5, 27.5, 56.5);
        avaliacao(ana, thiago, hoje.minusDays(6), 65.8, 1.65, 25.1, 70.0, 97.0, 28.0, 57.0);
        avaliacao(carlos, thiago, hoje.minusDays(60), 92.3, 1.78, 26.8, 98.0, 104.0, 35.0, 60.0);
        avaliacao(carlos, lucas, hoje.minusDays(10), 89.7, 1.78, 24.9, 95.0, 103.0, 35.5, 60.5);
        avaliacao(rafael, thiago, hoje.minusDays(124), 104.5, 1.82, 31.0, 108.0, 110.0, 37.0, 64.0);

        log.info("Dados de exemplo inseridos: {} alunos, {} professores, {} planos.",
                alunoRepository.count(), professorRepository.count(), planoRepository.count());
    }

    private Professor professor(String nome, String cpf, String cref, String especialidade, LocalDate admissao) {
        Professor p = new Professor();
        p.setNome(nome);
        p.setCpf(cpf);
        p.setCref(cref);
        p.setEspecialidade(especialidade);
        p.setDataAdmissao(admissao);
        p.setEmail(nome.toLowerCase().split(" ")[0] + "@academia.com");
        p.setTelefone("(24) 3471-00" + (10 + professorRepository.count()));
        return professorRepository.save(p);
    }

    private Aluno aluno(String nome, String cpf, String email, String telefone,
                        LocalDate nascimento, LocalDate matricula, Plano plano) {
        Aluno a = new Aluno();
        a.setNome(nome);
        a.setCpf(cpf);
        a.setEmail(email);
        a.setTelefone(telefone);
        a.setDataNascimento(nascimento);
        a.setDataMatricula(matricula);
        a.setPlano(plano);
        a = alunoRepository.save(a);
        mensalidadeService.gerarParaAluno(a, plano.getDuracaoMeses(), matricula);
        return a;
    }

    private void pagarAte(Aluno aluno, LocalDate limite, FormaPagamento forma, int diasDeAtraso) {
        List<Mensalidade> lista = mensalidadeRepository.findByAlunoIdOrderByDataVencimentoDesc(aluno.getId());
        for (Mensalidade m : lista) {
            if (m.getDataVencimento().isAfter(limite)) continue;
            LocalDate dataPagamento = m.getDataVencimento().plusDays(diasDeAtraso);
            if (dataPagamento.isAfter(LocalDate.now())) dataPagamento = LocalDate.now();
            m.setValorPago(mensalidadeService.calcularValorAtualizado(m, dataPagamento));
            m.setDataPagamento(dataPagamento);
            m.setFormaPagamento(forma);
            m.setStatus(StatusMensalidade.PAGA);
        }
    }

    private FichaTreino ficha(Aluno aluno, Professor professor, String nome, String objetivo, LocalDate inicio) {
        FichaTreino f = new FichaTreino();
        f.setAluno(aluno);
        f.setProfessor(professor);
        f.setNome(nome);
        f.setObjetivo(objetivo);
        f.setDataInicio(inicio);
        f.setDataFim(inicio.plusMonths(3));
        return f;
    }

    private void avaliacao(Aluno aluno, Professor professor, LocalDate data, double peso, double altura,
                           double gordura, double cintura, double quadril, double braco, double coxa) {
        AvaliacaoFisica a = new AvaliacaoFisica();
        a.setAluno(aluno);
        a.setProfessor(professor);
        a.setDataAvaliacao(data);
        a.setPeso(peso);
        a.setAltura(altura);
        a.setPercentualGordura(gordura);
        a.setCintura(cintura);
        a.setAbdomen(cintura + 4);
        a.setQuadril(quadril);
        a.setBracoDireito(braco);
        a.setCoxaDireita(coxa);
        a.setTorax(cintura + 18);
        a.setFrequenciaCardiacaRepouso(70);
        a.setPressaoArterial("120/80");
        avaliacaoRepository.save(a);
    }
}
