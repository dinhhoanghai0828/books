package books.service.impl;

import books.dao.interfaces.VolumeAdapter;
import books.dto.ContentDTO;
import books.dto.VolumeDTO;
import books.entity.Volume;
import books.service.interfaces.ContentService;
import books.service.interfaces.VolumeService;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class VolumeServiceImpl implements VolumeService {
    private VolumeAdapter volumeAdapter;
    private ModelMapper modelMapper;
    private ContentService contentService;

    @Autowired
    public VolumeServiceImpl(VolumeAdapter volumeAdapter, ModelMapper modelMapper, ContentService contentService) {
        this.volumeAdapter = volumeAdapter;
        this.modelMapper = modelMapper;
        this.contentService = contentService;
    }

    @Override
    public List<VolumeDTO> getVolumes() throws Exception {
        List<Volume> volumes = volumeAdapter.getVolumes();
        List<VolumeDTO> volumeDTOS = volumes.stream().map(volume -> {
            VolumeDTO dto = modelMapper.map(volume, VolumeDTO.class);
            dto.setIsRead(volume.getIsRead());
            return dto;
        }).collect(Collectors.toList());
        return volumeDTOS;
    }

    @Override
    public VolumeDTO getVolumeDetailBySlug(String slug) throws Exception {
        Volume volume = volumeAdapter.getVolumeDetailBySlug(slug);
        VolumeDTO dto = modelMapper.map(volume, VolumeDTO.class);
        dto.setIsRead(volume.getIsRead());
        return dto;
    }

    @Override
    public boolean updateVolume(VolumeDTO volumeDTO) throws Exception {
        Volume volume = modelMapper.map(volumeDTO, Volume.class);
        return volumeAdapter.updateVolume(volume);
    }

    @Override
    public boolean markAsRead(String slug) throws Exception {
        return volumeAdapter.markAsRead(slug);
    }

    @Override
    public boolean markAsUnread(String slug) throws Exception {
        return volumeAdapter.markAsUnread(slug);
    }

    @Override
    public List<ContentDTO> getContentsByVolumeSlug(String slug) throws Exception {
        return contentService.getContentByVolumeSlug(slug);
    }

    @Override
    public List<VolumeDTO> getVolumesByBookSlug(String bookSlug) throws Exception {
        List<Volume> volumes = volumeAdapter.getVolumesByBookSlug(bookSlug);
        List<VolumeDTO> volumeDTOS = volumes.stream().map(volume -> {
            VolumeDTO dto = modelMapper.map(volume, VolumeDTO.class);
            dto.setIsRead(volume.getIsRead());
            
            // Map contents from Volume entity to VolumeDTO
            if (volume.getContents() != null) {
                List<ContentDTO> contentDTOS = volume.getContents().stream()
                    .map(content -> modelMapper.map(content, ContentDTO.class))
                    .collect(Collectors.toList());
                dto.setContents(contentDTOS);
            }
            
            return dto;
        }).collect(Collectors.toList());
        return volumeDTOS;
    }
}
