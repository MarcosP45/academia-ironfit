package br.com.academia.controller;

import br.com.academia.dto.ProfessorDTO;
import br.com.academia.service.ProfessorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/professores")
public class ProfessorController {

    private final ProfessorService service;

    public ProfessorController(ProfessorService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProfessorDTO.Response> listar(@RequestParam(name = "busca", required = false) String busca) {
        return service.listar(busca);
    }

    @GetMapping("/{id}")
    public ProfessorDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProfessorDTO.Response criar(@Valid @RequestBody ProfessorDTO.Request req) {
        return service.criar(req);
    }

    @PutMapping("/{id}")
    public ProfessorDTO.Response atualizar(@PathVariable("id") Long id, @Valid @RequestBody ProfessorDTO.Request req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    public ProfessorDTO.Response alterarStatus(@PathVariable("id") Long id, @RequestParam("ativo") boolean ativo) {
        return service.alterarStatus(id, ativo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
