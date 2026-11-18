package br.com.academia.model;

import jakarta.persistence.*;

@Entity
@Table(name = "itens_treino")
public class ItemTreino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_id", nullable = false)
    private FichaTreino ficha;

    @Column(nullable = false)
    private Integer ordem;

    @Column(nullable = false, length = 120)
    private String exercicio;

    @Column(name = "grupo_muscular", length = 60)
    private String grupoMuscular;

    @Column(nullable = false)
    private Integer series;

    @Column(nullable = false, length = 30)
    private String repeticoes;

    private Double carga;

    @Column(name = "descanso_segundos")
    private Integer descansoSegundos;

    @Column(length = 255)
    private String observacao;

    public ItemTreino() {
    }

    public ItemTreino(Integer ordem, String exercicio, String grupoMuscular, Integer series,
                      String repeticoes, Double carga, Integer descansoSegundos, String observacao) {
        this.ordem = ordem;
        this.exercicio = exercicio;
        this.grupoMuscular = grupoMuscular;
        this.series = series;
        this.repeticoes = repeticoes;
        this.carga = carga;
        this.descansoSegundos = descansoSegundos;
        this.observacao = observacao;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public FichaTreino getFicha() { return ficha; }
    public void setFicha(FichaTreino ficha) { this.ficha = ficha; }
    public Integer getOrdem() { return ordem; }
    public void setOrdem(Integer ordem) { this.ordem = ordem; }
    public String getExercicio() { return exercicio; }
    public void setExercicio(String exercicio) { this.exercicio = exercicio; }
    public String getGrupoMuscular() { return grupoMuscular; }
    public void setGrupoMuscular(String grupoMuscular) { this.grupoMuscular = grupoMuscular; }
    public Integer getSeries() { return series; }
    public void setSeries(Integer series) { this.series = series; }
    public String getRepeticoes() { return repeticoes; }
    public void setRepeticoes(String repeticoes) { this.repeticoes = repeticoes; }
    public Double getCarga() { return carga; }
    public void setCarga(Double carga) { this.carga = carga; }
    public Integer getDescansoSegundos() { return descansoSegundos; }
    public void setDescansoSegundos(Integer descansoSegundos) { this.descansoSegundos = descansoSegundos; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
