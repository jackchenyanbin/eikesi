package com.eikesi.demo.de.service.repository;

import com.eikesi.demo.de.service.domain.DemoC;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.*;


/**
 * Spring Data JPA repository for the DemoC entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DemoCRepository extends JpaRepository<DemoC, Long> {

}
