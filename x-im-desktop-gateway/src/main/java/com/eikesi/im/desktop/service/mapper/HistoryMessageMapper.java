package com.eikesi.im.desktop.service.mapper;

import com.eikesi.im.desktop.domain.*;
import com.eikesi.im.desktop.service.dto.HistoryMessageDTO;

import org.mapstruct.*;

/**
 * Mapper for the entity HistoryMessage and its DTO HistoryMessageDTO.
 */
@Mapper(componentModel = "spring", uses = {})
public interface HistoryMessageMapper extends EntityMapper<HistoryMessageDTO, HistoryMessage> {



    default HistoryMessage fromId(Long id) {
        if (id == null) {
            return null;
        }
        HistoryMessage historyMessage = new HistoryMessage();
        historyMessage.setId(id);
        return historyMessage;
    }
}
