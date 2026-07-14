package fit.quanlyspa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuanLySpaApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuanLySpaApplication.class, args);
    }

}
