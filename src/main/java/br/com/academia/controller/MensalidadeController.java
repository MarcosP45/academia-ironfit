package br.com.academia.controller;

import br.com.academia.dto.MensalidadeDTO;
import br.com.academia.service.MensalidadeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensalidades")
public class MensalidadeController {

    private final MensalidadeService service;

    public MensalidadeController(MensalidadeService service) {
        this.service = service;
    }

    @GetMapping
    public List<MensalidadeDTO.Response> listar(@RequestParam(name = "alunoId", required = false) Long alunoId,
                                                @RequestParam(name = "situacao", required = false) String situacao) {
        return service.listar(alunoId, situacao);
    }

    @GetMapping("/{id}")
    public MensalidadeDTO.Response buscar(@PathVariable("id") Long id) {
        return service.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MensalidadeDTO.Response criar(@Valid @RequestBody MensalidadeDTO.Request req) {
        return service.criar(req);
    }

    @PostMapping("/gerar")
    @ResponseStatus(HttpStatus.CREATED)
    public List<MensalidadeDTO.Response> gerar(@Valid @RequestBody MensalidadeDTO.GerarRequest req) {
        return service.gerar(req);
    }

    @PatchMapping("/{id}/pagar")
    public MensalidadeDTO.Response pagar(@PathVariable("id") Long id,
                                         @Valid @RequestBody MensalidadeDTO.PagamentoRequest req) {
        return service.pagar(id, req);
    }

    @PatchMapping("/{id}/estornar")
    public MensalidadeDTO.Response estornar(@PathVariable("id") Long id) {
        return service.estornar(id);
    }

    @PatchMapping("/{id}/cancelar")
    public MensalidadeDTO.Response cancelar(@PathVariable("id") Long id) {
        return service.cancelar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable("id") Long id) {
        service.excluir(id);
    }
}
