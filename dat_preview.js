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
      var geometry = new THREE.Geometry();


      var i, l;
      var record = reader.records[1];
      for (i = 0, l = record.vertices.length; i < l; i++) {
        var v = record.vertices[i];
        geometry.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
      }

      record = reader.records[3];
      for (i = 0, l = record.faces.length; i < l; i++) {
        var f = record.faces[i];
        geometry.faces.push(new THREE.Face3(f[0], f[1], f[2]));
      }
      geometry.computeBoundingSphere();

      var model = new THREE.Mesh(geometry, material);


      scene.add(model);

      model.rotation.x = 0.5;
      camera.position.z = 1;

      console.log(geometry);


      // add subtle blue ambient lighting
      var ambientLight = new THREE.AmbientLight(0x009900);
      scene.add(ambientLight);

      // directional lighting
      var directionalLight = new THREE.DirectionalLight(0x999999);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);

      function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);

        model.rotation.y += 0.05;
      }
      render();

    });
  });

})();
