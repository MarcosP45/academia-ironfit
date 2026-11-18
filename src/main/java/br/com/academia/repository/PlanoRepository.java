package br.com.academia.repository;

import br.com.academia.model.Plano;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlanoRepository extends JpaRepository<Plano, Long> {

    List<Plano> findAllByOrderByDuracaoMesesAscNomeAsc();

    List<Plano> findByAtivoTrueOrderByDuracaoMesesAsc();

    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);

    long countByAtivoTrue();
}
