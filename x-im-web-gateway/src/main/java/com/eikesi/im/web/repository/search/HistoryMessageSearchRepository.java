package com.eikesi.im.web.repository.search;

import com.eikesi.im.web.domain.HistoryMessage;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * Spring Data Elasticsearch repository for the HistoryMessage entity.
 */
public interface HistoryMessageSearchRepository extends ElasticsearchRepository<HistoryMessage, Long> {
}
