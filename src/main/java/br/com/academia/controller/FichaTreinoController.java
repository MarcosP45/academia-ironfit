package br.com.academia.controller;

import br.com.academia.dto.FichaTreinoDTO;
import br.com.academia.service.FichaTreinoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fichas")
public class FichaTreinoController {

    private final FichaTreinoService service;

    public FichaTreinoController(FichaTreinoService service) {
        this.service = service;
    }

    @GetMapping
    public List<FichaTreinoDTO.Response> listar(@RequestParam(name = "alunoId", required = false) Long alunoId,
                                                @RequestParam(name = "ativas", required = false) Boolean ativas) {
        return service.listar(alunoId, ativas);
    }

    @GetMapping("/{id}")
    public FichaTreinoDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FichaTreinoDTO.Response criar(@Valid @RequestBody FichaTreinoDTO.Request req) {
        return service.criar(req);
    }

    @PutMapping("/{id}")
    public FichaTreinoDTO.Response atualizar(@PathVariable("id") Long id, @Valid @RequestBody FichaTreinoDTO.Request req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/status")
    public FichaTreinoDTO.Response alterarStatus(@PathVariable("id") Long id, @RequestParam("ativa") boolean ativa) {
        return service.alterarStatus(id, ativa);
    }

    @PostMapping("/{id}/duplicar")
    @ResponseStatus(HttpStatus.CREATED)
    public FichaTreinoDTO.Response duplicar(@PathVariable("id") Long id) {
        return service.duplicar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
