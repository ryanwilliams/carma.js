(function () {

  // When input changes, load the file!
  var datFileInput = document.querySelector('#dat-file-input');
  datFileInput.addEventListener('change', function (e) {
    console.log("Dat FILE CHANGED!", e);
    var reader = new carmageddon.StainlessFileReader({file: e.target.files[0]});
    reader.addEventListener('load', function (e) {
      console.log('Loaded!', reader.toJSON());

      var width = 480, height = 360;

      var container = document.querySelector('#dat-preview');
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

      var renderer = new THREE.WebGLRenderer({antialiasing: true});
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);



      var material = new THREE.MeshLambertMaterial({color: 0x00ff00});


      var models = [];

      var geometry;
      var i, j;
      for (i = 0; i < reader.records.length; i++) {
        var record = reader.records[i];
        console.log("RECORD", record);

        if (record.vertices) {
          geometry = new THREE.Geometry();

          for (j = 0; j < record.vertices.length; j++) {
            var v = record.vertices[j];
            geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
          }
        }

        else if (record.faces) {
          for (j = 0; j < record.faces.length; j++) {
            var f = record.faces[j];
            geometry.faces.push(new THREE.Face3(f[0], f[1], f[2]));
          }
          geometry.computeFaceNormals();
          geometry.computeBoundingBox();
          var model = new THREE.Mesh(geometry, material);
          models.push(model);
          scene.add(model);
        }
      }





      camera.position.z = 1;

      // add subtle blue ambient lighting
      var ambientLight = new THREE.AmbientLight(0x333333);
      scene.add(ambientLight);

      // directional lighting
      var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);

      function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);

        for (i = 0; i < models.length; i++) {
          var m = models[i];
          m.rotation.x = 0.5;
          m.rotation.y += 0.05;
        }
      }
      render();

    });
  });

})();
