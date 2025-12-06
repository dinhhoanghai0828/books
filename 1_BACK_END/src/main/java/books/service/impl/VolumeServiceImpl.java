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
        List<VolumeDTO> volumeDTOS = volumes.stream().map(book -> modelMapper.map(book, VolumeDTO.class)).collect(Collectors.toList());
        return volumeDTOS;
    }

    @Override
    public VolumeDTO getVolumeDetailBySlug(String slug) throws Exception {
        Volume volume = volumeAdapter.getVolumeDetailBySlug(slug);
        return modelMapper.map(volume, VolumeDTO.class);
    }
}
