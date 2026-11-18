package br.com.academia.controller;

import br.com.academia.dto.AlunoDTO;
import br.com.academia.service.AlunoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alunos")
public class AlunoController {

    private final AlunoService service;

    public AlunoController(AlunoService service) {
        this.service = service;
    }

    @GetMapping
    public List<AlunoDTO.Response> listar(@RequestParam(name = "busca", required = false) String busca,
                                          @RequestParam(name = "ativo", required = false) Boolean ativo) {
        return service.listar(busca, ativo);
    }

    @GetMapping("/{id}")
    public AlunoDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlunoDTO.Response criar(@Valid @RequestBody AlunoDTO.Request req) {
        return service.criar(req);
    }

    @PutMapping("/{id}")
    public AlunoDTO.Response atualizar(@PathVariable("id") Long id, @Valid @RequestBody AlunoDTO.Request req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    public AlunoDTO.Response alterarStatus(@PathVariable("id") Long id, @RequestParam("ativo") boolean ativo) {
        return service.alterarStatus(id, ativo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
