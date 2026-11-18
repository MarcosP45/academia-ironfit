package br.com.academia.repository;

import br.com.academia.model.AvaliacaoFisica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AvaliacaoFisicaRepository extends JpaRepository<AvaliacaoFisica, Long> {

    List<AvaliacaoFisica> findAllByOrderByDataAvaliacaoDescIdDesc();

    List<AvaliacaoFisica> findByAlunoIdOrderByDataAvaliacaoAscIdAsc(Long alunoId);

    List<AvaliacaoFisica> findByAlunoIdOrderByDataAvaliacaoDescIdDesc(Long alunoId);

    void deleteByAlunoId(Long alunoId);

    boolean existsByProfessorId(Long professorId);

    long countByDataAvaliacaoBetween(LocalDate inicio, LocalDate fim);
}
