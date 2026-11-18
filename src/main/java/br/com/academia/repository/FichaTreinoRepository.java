package br.com.academia.repository;

import br.com.academia.model.FichaTreino;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FichaTreinoRepository extends JpaRepository<FichaTreino, Long> {

    List<FichaTreino> findAllByOrderByAtivaDescDataInicioDesc();

    List<FichaTreino> findByAlunoIdOrderByAtivaDescDataInicioDesc(Long alunoId);

    List<FichaTreino> findByAlunoId(Long alunoId);

    boolean existsByProfessorId(Long professorId);

    long countByAtivaTrue();
}
