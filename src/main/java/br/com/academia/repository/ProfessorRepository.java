package br.com.academia.repository;

import br.com.academia.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {

    @Query("""
            SELECT p FROM Professor p
            WHERE LOWER(p.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(COALESCE(p.especialidade, '')) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(p.cref) LIKE LOWER(CONCAT('%', :termo, '%'))
            ORDER BY p.nome
            """)
    List<Professor> buscar(@Param("termo") String termo);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    boolean existsByCrefIgnoreCase(String cref);

    boolean existsByCrefIgnoreCaseAndIdNot(String cref, Long id);

    long countByAtivoTrue();
}
