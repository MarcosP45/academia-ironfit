package br.com.academia.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "avaliacoes_fisicas")
public class AvaliacaoFisica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "professor_id")
    private Professor professor;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate dataAvaliacao;

    @Column(nullable = false)
    private Double peso;

    @Column(nullable = false)
    private Double altura;

    @Column(name = "percentual_gordura")
    private Double percentualGordura;

    private Double torax;
    private Double cintura;
    private Double abdomen;
    private Double quadril;
    @Column(name = "braco_direito")
    private Double bracoDireito;
    @Column(name = "coxa_direita")
    private Double coxaDireita;

    @Column(name = "frequencia_cardiaca_repouso")
    private Integer frequenciaCardiacaRepouso;

    @Column(name = "pressao_arterial", length = 10)
    private String pressaoArterial;

    @Column(length = 1000)
    private String observacoes;

    public Double getImc() {
        if (peso == null || altura == null || altura <= 0) return null;
        return arredondar(peso / (altura * altura));
    }

    public String getClassificacaoImc() {
        Double imc = getImc();
        if (imc == null) return null;
        if (imc < 18.5) return "Abaixo do peso";
        if (imc < 25) return "Peso normal";
        if (imc < 30) return "Sobrepeso";
        if (imc < 35) return "Obesidade grau I";
        if (imc < 40) return "Obesidade grau II";
        return "Obesidade grau III";
    }

    public Double getMassaGorda() {
        if (percentualGordura == null || peso == null) return null;
        return arredondar(peso * percentualGordura / 100);
    }

    public Double getMassaMagra() {
        Double gorda = getMassaGorda();
        if (gorda == null) return null;
        return arredondar(peso - gorda);
    }

    public Double getRelacaoCinturaQuadril() {
        if (cintura == null || quadril == null || quadril == 0) return null;
        return Math.round(cintura / quadril * 100.0) / 100.0;
    }

    private static Double arredondar(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Aluno getAluno() { return aluno; }
    public void setAluno(Aluno aluno) { this.aluno = aluno; }
    public Professor getProfessor() { return professor; }
    public void setProfessor(Professor professor) { this.professor = professor; }
    public LocalDate getDataAvaliacao() { return dataAvaliacao; }
    public void setDataAvaliacao(LocalDate dataAvaliacao) { this.dataAvaliacao = dataAvaliacao; }
    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }
    public Double getAltura() { return altura; }
    public void setAltura(Double altura) { this.altura = altura; }
    public Double getPercentualGordura() { return percentualGordura; }
    public void setPercentualGordura(Double percentualGordura) { this.percentualGordura = percentualGordura; }
    public Double getTorax() { return torax; }
    public void setTorax(Double torax) { this.torax = torax; }
    public Double getCintura() { return cintura; }
    public void setCintura(Double cintura) { this.cintura = cintura; }
    public Double getAbdomen() { return abdomen; }
    public void setAbdomen(Double abdomen) { this.abdomen = abdomen; }
    public Double getQuadril() { return quadril; }
    public void setQuadril(Double quadril) { this.quadril = quadril; }
    public Double getBracoDireito() { return bracoDireito; }
    public void setBracoDireito(Double bracoDireito) { this.bracoDireito = bracoDireito; }
    public Double getCoxaDireita() { return coxaDireita; }
    public void setCoxaDireita(Double coxaDireita) { this.coxaDireita = coxaDireita; }
    public Integer getFrequenciaCardiacaRepouso() { return frequenciaCardiacaRepouso; }
    public void setFrequenciaCardiacaRepouso(Integer frequenciaCardiacaRepouso) { this.frequenciaCardiacaRepouso = frequenciaCardiacaRepouso; }
    public String getPressaoArterial() { return pressaoArterial; }
    public void setPressaoArterial(String pressaoArterial) { this.pressaoArterial = pressaoArterial; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
