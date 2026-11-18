package br.com.academia.controller;

import br.com.academia.dto.PlanoDTO;
import br.com.academia.service.PlanoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planos")
public class PlanoController {

    private final PlanoService service;

    public PlanoController(PlanoService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlanoDTO.Response> listar(@RequestParam(name = "ativos", defaultValue = "false") boolean ativos) {
        return service.listar(ativos);
    }

    @GetMapping("/{id}")
    public PlanoDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanoDTO.Response criar(@Valid @RequestBody PlanoDTO.Request req) {
        return service.criar(req);
    }

    @PutMapping("/{id}")
    public PlanoDTO.Response atualizar(@PathVariable("id") Long id, @Valid @RequestBody PlanoDTO.Request req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    public PlanoDTO.Response alterarStatus(@PathVariable("id") Long id, @RequestParam("ativo") boolean ativo) {
        return service.alterarStatus(id, ativo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
