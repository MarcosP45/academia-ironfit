package br.com.academia.repository;

import br.com.academia.model.Mensalidade;
import br.com.academia.model.StatusMensalidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MensalidadeRepository extends JpaRepository<Mensalidade, Long> {

    List<Mensalidade> findAllByOrderByDataVencimentoDesc();

    List<Mensalidade> findByAlunoIdOrderByDataVencimentoDesc(Long alunoId);

    boolean existsByAlunoIdAndDataVencimento(Long alunoId, LocalDate dataVencimento);

    Optional<Mensalidade> findFirstByAlunoIdOrderByDataVencimentoDesc(Long alunoId);

    void deleteByAlunoId(Long alunoId);

    long countByStatusAndDataVencimentoBefore(StatusMensalidade status, LocalDate data);

    @Query("SELECT COUNT(DISTINCT m.aluno.id) FROM Mensalidade m WHERE m.status = :status AND m.dataVencimento < :data")
    long contarAlunosInadimplentes(@Param("status") StatusMensalidade status, @Param("data") LocalDate data);

    @Query("SELECT DISTINCT m.aluno.id FROM Mensalidade m WHERE m.status = :status AND m.dataVencimento < :data")
    List<Long> idsAlunosComStatusAntesDe(@Param("status") StatusMensalidade status, @Param("data") LocalDate data);

    List<Mensalidade> findByStatusAndDataVencimentoBeforeOrderByDataVencimentoAsc(StatusMensalidade status, LocalDate data);

    List<Mensalidade> findTop8ByStatusAndDataVencimentoBetweenOrderByDataVencimentoAsc(
            StatusMensalidade status, LocalDate inicio, LocalDate fim);

    @Query("SELECT COALESCE(SUM(m.valorPago), 0) FROM Mensalidade m " +
           "WHERE m.status = br.com.academia.model.StatusMensalidade.PAGA " +
           "AND m.dataPagamento BETWEEN :inicio AND :fim")
    BigDecimal totalRecebido(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM Mensalidade m " +
           "WHERE m.status = br.com.academia.model.StatusMensalidade.PENDENTE " +
           "AND m.dataVencimento BETWEEN :inicio AND :fim")
    BigDecimal totalAReceber(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM Mensalidade m " +
           "WHERE m.status = br.com.academia.model.StatusMensalidade.PENDENTE AND m.dataVencimento < :hoje")
    BigDecimal totalEmAtraso(@Param("hoje") LocalDate hoje);
}
