package br.com.academia.controller;

import br.com.academia.dto.AvaliacaoFisicaDTO;
import br.com.academia.service.AvaliacaoFisicaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoFisicaController {

    private final AvaliacaoFisicaService service;

    public AvaliacaoFisicaController(AvaliacaoFisicaService service) {
        this.service = service;
    }

    @GetMapping
    public List<AvaliacaoFisicaDTO.Response> listar(@RequestParam(name = "alunoId", required = false) Long alunoId) {
        return service.listar(alunoId);
    }

    @GetMapping("/{id}")
    public AvaliacaoFisicaDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @GetMapping("/evolucao/{alunoId}")
    public AvaliacaoFisicaDTO.Evolucao evolucao(@PathVariable("alunoId") Long alunoId) {
        return service.evolucao(alunoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvaliacaoFisicaDTO.Response criar(@Valid @RequestBody AvaliacaoFisicaDTO.Request req) {
        return service.criar(req);
    }

    @PutMapping("/{id}")
    public AvaliacaoFisicaDTO.Response atualizar(@PathVariable("id") Long id,
                                                 @Valid @RequestBody AvaliacaoFisicaDTO.Request req) {
        return service.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
