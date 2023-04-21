package tn.apis.poc.logging.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.apis.poc.logging.model.Message;

@RestController
@RequestMapping("/v1/app3/logging")
public class DefaultController {

    private Logger logger = LoggerFactory.getLogger(DefaultController.class);

    @PostMapping
    public ResponseEntity<?> log(@RequestBody Message message) {
        logger.info("A request was made to third application");

        return ResponseEntity.ok().build();
    }

}
