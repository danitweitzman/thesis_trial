import { GUI } from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';

// Function to update the emotion list display
function updateEmotionList(params, applyPreset) {
  const emotionItems = document.getElementById('emotion-items');
  emotionItems.innerHTML = '';
  
  Object.keys(params.EMOTIONS).forEach(emotionName => {
    const item = document.createElement('div');
    item.className = 'emotion-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = emotionName;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'X';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => deleteEmotion(emotionName, params, applyPreset);
    
    item.appendChild(nameSpan);
    item.appendChild(deleteBtn);
    emotionItems.appendChild(item);
  });
}

// Function to delete an emotion
function deleteEmotion(emotionName, params, applyPreset) {
  // Don't delete if it's the last emotion
  if (Object.keys(params.EMOTIONS).length <= 1) {
    alert('Cannot delete the last emotion!');
    return;
  }
  
  // Switch to a different emotion if the current one is being deleted
  if (params.preset === emotionName) {
    const newPreset = Object.keys(params.EMOTIONS).find(name => name !== emotionName) || 'Neutral';
    applyPreset(newPreset);
    params.preset = newPreset;
  }
  
  // Delete the emotion
  delete params.EMOTIONS[emotionName];
  
  // Update localStorage
  localStorage.setItem('customEmotions', JSON.stringify(params.EMOTIONS));
  
  // Update the GUI and emotion list
  updateEmotionList(params, applyPreset);
  updatePresetController();
}

export function setupGUI(params, meshMaterial, pointsMaterial, bloomPass, applyPreset, togglePointMode, renderer) {
  const gui = new GUI();

  // Emotion preset folder
  const emotionFolder = gui.addFolder('Emotions');
  
  // Declare presetController variable first
  let presetController;
  
  // Function to create/update preset controller
  function updatePresetController() {
    // Remove existing controller if it exists
    if (presetController) {
      emotionFolder.remove(presetController);
    }
    // Create new controller
    presetController = emotionFolder.add(params, 'preset', Object.keys(params.EMOTIONS))
      .name('Current Emotion')
      .onChange((value) => {
        if (typeof applyPreset === 'function') {
          applyPreset(value);
          
          // Update all GUI controllers to match the new preset
          const preset = params.EMOTIONS[value];
          if (preset) {
            // Update all controllers to match the preset values
            Object.keys(preset).forEach(key => {
              const controller = gui.controllers.find(c => c.property === key);
              if (controller) {
                controller.setValue(preset[key]);
              }
            });
          }
        }
      });
    return presetController;
  }
  
  // Initial creation of preset controller
  presetController = updatePresetController();

  // Save emotion controls
  const saveControls = {
    newEmotionName: '',
    saveEmotion: function() {
      const emotionName = this.newEmotionName.trim();
      if (emotionName === '') {
        alert('Please enter an emotion name');
        return;
      }
      
      // Create new emotion preset from current parameters
      const newEmotion = {
        amplitude: Number(params.amplitude),
        frequency: Number(params.frequency),
        bloom: Number(params.bloom),
        color: Number(params.color),
        modifier: Number(params.modifier),
        ribAmp: Number(params.ribAmp),
        ribFreq: Number(params.ribFreq),
        noiseSpeed: Number(params.noiseSpeed),
        rotationSpeed: Number(params.rotationSpeed),
        backgroundColor: Number(params.backgroundColor),
        metalness: Number(params.metalness),
        roughness: Number(params.roughness),
        transmission: Number(params.transmission),
        thickness: Number(params.thickness),
        clearcoat: Number(params.clearcoat),
        clearcoatRoughness: Number(params.clearcoatRoughness),
        envMapIntensity: Number(params.envMapIntensity),
        pointMode: Boolean(params.pointMode),
        pointSize: Number(params.pointSize),
        useTexture: Boolean(params.useTexture)
      };
      
      // Add to EMOTIONS object
      params.EMOTIONS[emotionName] = newEmotion;
      
      // Set as current preset
      params.preset = emotionName;
      
      // Update preset dropdown by recreating it
      presetController = updatePresetController();
      
      // Save to localStorage for persistence
      localStorage.setItem('customEmotions', JSON.stringify(params.EMOTIONS));
      
      // Update emotion list
      updateEmotionList(params, applyPreset);
      
      console.log('Saved emotion:', emotionName, newEmotion);
      
      // Apply the preset immediately
      if (typeof applyPreset === 'function') {
        applyPreset(emotionName);
      }

      // Clear input last
      this.newEmotionName = '';
      emotionNameController.updateDisplay();
    },
    exportEmotions: function() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params.EMOTIONS, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "emotions_dataset.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  const saveFolder = gui.addFolder('Save & Export');
  const emotionNameController = saveFolder.add(saveControls, 'newEmotionName').name('New Emotion Name');
  saveFolder.add(saveControls, 'saveEmotion').name('Save Current as Emotion');
  saveFolder.add(saveControls, 'exportEmotions').name('Export Emotions Dataset');

  // Load custom emotions from localStorage
  const savedEmotions = localStorage.getItem('customEmotions');
  if (savedEmotions) {
    params.EMOTIONS = JSON.parse(savedEmotions);
    presetController = updatePresetController();
  }

  // Initialize emotion list
  updateEmotionList(params, applyPreset);

  // Parameters folder
  const paramsFolder = gui.addFolder('Parameters');
  
  paramsFolder.add(params, 'modifier', { 'None': 0, 'Droopy': 1, 'Ribbed': 2 })
    .name('Modifier')
    .onChange((value) => {
      params.modifier = Number(value);
      console.log('Modifier changed to:', params.modifier, typeof params.modifier);
    });

  paramsFolder.add(params, 'amplitude', 0, 1, 0.01)
    .name('Amplitude')
    .onChange((value) => {
      transitionState.target.amplitude = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.add(params, 'frequency', 0.1, 5, 0.01)
    .name('Frequency')
    .onChange((value) => {
      transitionState.target.frequency = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.add(params, 'bloom', 0, 1, 0.01)
    .name('Bloom')
    .onChange(v => {
      if (bloomPass) bloomPass.strength = v;
    });

  paramsFolder.add(params, 'noiseSpeed', 0, 3, 0.01)
    .name('Noise Speed')
    .onChange((value) => {
      transitionState.target.noiseSpeed = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.add(params, 'rotationSpeed', 0, 1, 0.01)
    .name('Rotation Speed')
    .onChange((value) => {
      transitionState.target.rotationSpeed = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.add(params, 'ribAmp', 0.0, 1.0, 0.01)
    .name('Rib Amplitude')
    .onChange((value) => {
      transitionState.target.ribAmp = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.add(params, 'ribFreq', 1.0, 30.0, 0.1)
    .name('Rib Frequency')
    .onChange((value) => {
      transitionState.target.ribFreq = value;
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.addColor(params, 'color')
    .name('Color')
    .onChange((value) => {
      transitionState.targetColor.setHex(value);
      transitionState.elapsed = 0;
      transitionState.isTransitioning = true;
    });

  paramsFolder.addColor(params, 'backgroundColor')
    .name('Background Color')
    .onChange((value) => {
      // if (renderer) {
      //   renderer.setClearColor(value); // Disabled: always use fixed color
      // }
    });

  // Visual Settings folder
  const visualFolder = gui.addFolder('Visual Settings');
  
  visualFolder.add(params, 'pointMode')
    .name('Point Mode')
    .onChange(v => {
      if (typeof togglePointMode === 'function') {
        togglePointMode(v);
      }
    });

  visualFolder.add(params, 'pointSize', 0.001, 0.1, 0.001)
    .name('Point Size')
    .onChange((value) => {
      if (pointsMaterial) pointsMaterial.size = value;
    });

  visualFolder.add(params, 'useTexture')
    .name('Use Texture');

  // Material Properties folder
  const materialFolder = gui.addFolder('Material Properties');
  
  materialFolder.add(params, 'metalness', 0.0, 1.0, 0.01).onChange(v => {
    meshMaterial.metalness = v;
  });
  materialFolder.add(params, 'roughness', 0.0, 1.0, 0.01).onChange(v => {
    meshMaterial.roughness = v;
  });
  materialFolder.add(params, 'transmission', 0.0, 1.0, 0.01).onChange(v => {
    meshMaterial.transmission = v;
  });
  materialFolder.add(params, 'thickness', 0.0, 2.0, 0.01).onChange(v => {
    meshMaterial.thickness = v;
  });
  materialFolder.add(params, 'clearcoat', 0.0, 1.0, 0.01).onChange(v => {
    meshMaterial.clearcoat = v;
  });
  materialFolder.add(params, 'clearcoatRoughness', 0.0, 1.0, 0.01).onChange(v => {
    meshMaterial.clearcoatRoughness = v;
  });
  materialFolder.add(params, 'envMapIntensity', 0.0, 2.0, 0.01).onChange(v => {
    meshMaterial.envMapIntensity = v;
  });

  // Open the Emotions folder by default
  emotionFolder.open();
    
  return gui;
}
