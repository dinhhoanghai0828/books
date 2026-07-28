package books.service.impl;

import books.dao.interfaces.VolumeAdapter;
import books.dto.VolumeDTO;
import books.entity.Volume;
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

    @Autowired
    public VolumeServiceImpl(VolumeAdapter volumeAdapter, ModelMapper modelMapper) {
        this.volumeAdapter = volumeAdapter;
        this.modelMapper = modelMapper;
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
}
