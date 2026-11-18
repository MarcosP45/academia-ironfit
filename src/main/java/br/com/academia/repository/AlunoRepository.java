package br.com.academia.repository;

import br.com.academia.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    @Query("""
            SELECT a FROM Aluno a
            WHERE (LOWER(a.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
                   OR a.cpf LIKE CONCAT('%', :termo, '%')
                   OR (:digitos <> '' AND a.cpf LIKE CONCAT('%', :digitos, '%')))
              AND (:ativo IS NULL OR a.ativo = :ativo)
            ORDER BY a.nome
            """)
    List<Aluno> buscar(@Param("termo") String termo, @Param("digitos") String digitos, @Param("ativo") Boolean ativo);

    boolean existsByCpf(String cpf);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    boolean existsByPlanoId(Long planoId);

    long countByPlanoId(Long planoId);

    long countByAtivoTrue();
}
