package tn.apis.poc.logging.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.apis.poc.logging.model.Message;

@RestController
@RequestMapping("/v1/app1/logging")
public class DefaultController {

    @Autowired
    private RestTemplate restTemplate;

    private Logger logger = LoggerFactory.getLogger(DefaultController.class);

    @Value("${secondApp.url}")
    private String secondAppUrl;

    @PostMapping
    public void log(@RequestBody Message message) {
        logger.info("A request was made to first application");
        logger.info("Sending a POST request to second application");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Message> request = new HttpEntity<>(message, headers);

        restTemplate.postForEntity(secondAppUrl, request, String.class);
    }

}
