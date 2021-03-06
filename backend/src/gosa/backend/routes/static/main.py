import pkg_resources
from gosa.common import Environment
from gosa.common.hsts_request_handler import HSTSStaticFileHandler


class StaticHandler(HSTSStaticFileHandler):

    def initialize(self):
        path = pkg_resources.resource_filename("gosa.backend", "data/templates")
        super(StaticHandler, self).initialize(path)


class ImageHandler(HSTSStaticFileHandler):

    def initialize(self):
        env = Environment.getInstance()
        path = env.config.get("user.image-path", "/var/lib/gosa/images")
        super(ImageHandler, self).initialize(path)


class WorkflowHandler(HSTSStaticFileHandler):

    def initialize(self):
        env = Environment.getInstance()
        path = env.config.get("core.workflow_path", "/var/lib/gosa/workflows")
        super(WorkflowHandler, self).initialize(path)

    def get(self, path, include_body=True):

        parts = path.split("/")
        parts.insert(1, "resources")

        return super(WorkflowHandler, self).get("/".join(parts), include_body)

